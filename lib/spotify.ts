import {
  SPOTIFY_API_BASE_URL,
  SPOTIFY_AUTH_URL,
  SPOTIFY_TOKEN_URL,
} from "./constants";
import type {
  TokenData,
  TokenResponse,
  SpotifyProfile,
  SpotifyAlbum,
  ParsedLine,
  ParsedLineWithYear,
} from "./types";

// ============ PKCE Helpers ============

export function generateRandomString(length: number): string {
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], "");
}

export function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++)
    binary += String.fromCharCode(bytes[i]);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function sha256(plain: string): Promise<ArrayBuffer> {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(plain));
}

export async function createPkcePair(): Promise<{
  verifier: string;
  challenge: string;
}> {
  const verifier = generateRandomString(64);
  const hashed = await sha256(verifier);
  const challenge = base64UrlEncode(hashed);
  return { verifier, challenge };
}

// ============ Token Store (localStorage) ============

const TOKEN_KEY = "paste2playlist_token";
const PROFILE_KEY = "paste2playlist_profile";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function getToken(): TokenData | null {
  if (!isBrowser()) return null;
  return safeJsonParse<TokenData>(localStorage.getItem(TOKEN_KEY));
}

export function setToken(tokenResponse: TokenResponse): void {
  const data: TokenData = {
    access_token: tokenResponse.access_token,
    refresh_token: tokenResponse.refresh_token ?? "",
    expires_at: Date.now() + tokenResponse.expires_in * 1000,
    token_type: tokenResponse.token_type,
    scope: tokenResponse.scope ?? "",
  };
  localStorage.setItem(TOKEN_KEY, JSON.stringify(data));
}

export function clearToken(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(PROFILE_KEY);
}

export function getStoredProfile(): SpotifyProfile | null {
  if (!isBrowser()) return null;
  return safeJsonParse<SpotifyProfile>(localStorage.getItem(PROFILE_KEY));
}

export function setStoredProfile(profile: SpotifyProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function isTokenExpired(): boolean {
  const token = getToken();
  if (!token) return true;
  // 60s buffer
  return Date.now() > token.expires_at - 60_000;
}

// ============ Auth Flow ============

export function buildAuthorizeUrl(
  clientId: string,
  redirectUri: string,
  state: string,
  codeChallenge: string
): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: "playlist-modify-private playlist-modify-public",
    redirect_uri: redirectUri,
    state,
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
  });

  return `${SPOTIFY_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForToken(
  code: string,
  verifier: string,
  redirectUri: string,
  clientId: string
): Promise<TokenData> {
  const params = new URLSearchParams({
    client_id: clientId,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
  });

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text().catch(() => "");
    throw new Error(`Token exchange failed: ${error}`);
  }

  const data = (await response.json()) as TokenResponse;
  setToken(data);
  return getToken()!;
}

export async function refreshAccessToken(
  refreshToken: string,
  clientId: string
): Promise<TokenData> {
  const params = new URLSearchParams({
    client_id: clientId,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) throw new Error("Token refresh failed");

  const data = (await response.json()) as TokenResponse;

  // Spotify may or may not return a new refresh_token
  setToken({
    ...data,
    refresh_token: data.refresh_token ?? refreshToken,
  });

  return getToken()!;
}

// ============ API Wrapper with Auto-Refresh ============

let isRefreshing = false;

const artistIdCache = new Map<string, string>();

export async function spotifyFetch(
  path: string,
  options: RequestInit = {},
  clientId: string
): Promise<Response> {
  let token = getToken();
  if (!token) throw new Error("Not authenticated");

  if (isTokenExpired() && !isRefreshing) {
    isRefreshing = true;
    try {
      token = await refreshAccessToken(token.refresh_token, clientId);
    } catch {
      clearToken();
      throw new Error("Session expired. Please reconnect.");
    } finally {
      isRefreshing = false;
    }
  }

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token.access_token}`);

  let response = await fetch(`${SPOTIFY_API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // 429 rate limit: retry with Retry-After + jitter
  if (response.status === 429) {
    let attempts = 0;

    while (response.status === 429 && attempts < 10) {
      const retryAfterHeader = response.headers.get("Retry-After");
      const retryAfterSec = retryAfterHeader
        ? Number.parseInt(retryAfterHeader, 10)
        : 1;
      const jitterMs = Math.floor(Math.random() * 350);

      await new Promise((resolve) =>
        setTimeout(resolve, retryAfterSec * 1000 + jitterMs)
      );

      response = await fetch(`${SPOTIFY_API_BASE_URL}${path}`, {
        ...options,
        headers,
      });
      attempts += 1;
    }
  }

  // 401: try refresh once
  if (response.status === 401 && !isRefreshing) {
    isRefreshing = true;
    try {
      token = await refreshAccessToken(token.refresh_token, clientId);
      headers.set("Authorization", `Bearer ${token.access_token}`);
      response = await fetch(`${SPOTIFY_API_BASE_URL}${path}`, {
        ...options,
        headers,
      });
    } catch {
      clearToken();
      throw new Error("Session expired. Please reconnect.");
    } finally {
      isRefreshing = false;
    }
  }

  return response;
}

// ============ Spotify API Methods ============

export async function getMe(clientId: string): Promise<SpotifyProfile> {
  const response = await spotifyFetch("/me", {}, clientId);
  if (!response.ok) {
    throw new Error(
      "This app is in testing mode. Ask the app owner to add your Spotify email to the allowlist."
    );
  }
  const profile = (await response.json()) as SpotifyProfile;
  setStoredProfile(profile);
  return profile;
}

export async function createPlaylist(
  userId: string,
  name: string,
  description: string,
  isPublic: boolean,
  clientId: string
): Promise<{ id: string; external_urls: { spotify: string } }> {
  const response = await spotifyFetch(
    `/users/${userId}/playlists`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, public: isPublic }),
    },
    clientId
  );
  if (!response.ok) throw new Error("Failed to create playlist");
  return response.json();
}

export async function searchArtistId(
  artistName: string,
  clientId: string
): Promise<string | null> {
  const key = artistName.toLowerCase().trim();
  const cached = artistIdCache.get(key);
  if (cached) return cached;

  const q = encodeURIComponent(`artist:"${artistName}"`);
  const res = await spotifyFetch(
    `/search?q=${q}&type=artist&limit=5`,
    {},
    clientId
  );
  if (!res.ok) throw new Error("Failed to search artist");
  const data = await res.json();

  const items: { id: string; name: string }[] = data.artists?.items ?? [];
  if (!items.length) return null;

  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .trim();
  const target = norm(artistName);

  const id = (items.find((a) => norm(a.name) === target) ?? items[0]).id;
  artistIdCache.set(key, id);
  return id;
}

type SpotifyArtistAlbumItem = {
  id: string;
  name: string;
  album_type: string;
  release_date?: string;
  release_date_precision?: string;
  artists: { name: string }[];
  external_urls?: { spotify: string };
  images?: { url: string }[];
};

function releaseYear(item: { release_date?: string }): number | null {
  if (!item.release_date) return null;
  const y = Number(item.release_date.slice(0, 4));
  return Number.isFinite(y) ? y : null;
}

function normalizeTitle(s: string): string {
  return s
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(
      /\b(deluxe|expanded|remaster(ed)?|anniversary|clean|explicit|edition|version)\b/g,
      ""
    )
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function dedupeByNormalizedName(
  items: SpotifyArtistAlbumItem[]
): SpotifyArtistAlbumItem[] {
  const map = new Map<string, SpotifyArtistAlbumItem>();

  for (const it of items) {
    const key = normalizeTitle(it.name);
    const existing = map.get(key);

    if (!existing) {
      map.set(key, it);
      continue;
    }

    const prefer =
      (existing.album_type !== "album" && it.album_type === "album") ||
      (existing.release_date &&
        it.release_date &&
        it.release_date < existing.release_date);

    if (prefer) map.set(key, it);
  }

  return [...map.values()];
}

export async function findFullLengthAlbumByYear(
  artistName: string,
  year: number,
  clientId: string,
  market = "US"
): Promise<SpotifyAlbum | null> {
  const artistId = await searchArtistId(artistName, clientId);
  if (!artistId) return null;

  const collected: SpotifyArtistAlbumItem[] = [];
  let offset = 0;
  const limit = 50;

  while (true) {
    const path = `/artists/${artistId}/albums?include_groups=album&limit=${limit}&offset=${offset}&market=${market}`;
    const res = await spotifyFetch(path, {}, clientId);
    if (!res.ok) throw new Error("Failed to fetch artist albums");
    const data = await res.json();

    const items: SpotifyArtistAlbumItem[] = data.items ?? [];
    collected.push(...items);

    if (!data.next || items.length < limit) break;
    offset += limit;
  }

  const inYear = collected.filter((a) => releaseYear(a) === year);
  if (!inYear.length) return null;

  const deduped = dedupeByNormalizedName(inYear).sort((a, b) =>
    (a.release_date ?? "").localeCompare(b.release_date ?? "")
  );

  const chosen = deduped[0];
  if (!chosen) return null;

  return {
    id: chosen.id,
    name: chosen.name,
    artists: chosen.artists,
    album_type: chosen.album_type,
    external_urls: chosen.external_urls ?? { spotify: "" },
    images: chosen.images ?? [],
    release_date: chosen.release_date,
    release_date_precision: chosen.release_date_precision,
  };
}

export async function searchAlbum(
  artist: string,
  album: string,
  clientId: string
): Promise<SpotifyAlbum | null> {
  const query1 = encodeURIComponent(`album:"${album}" artist:"${artist}"`);
  const response1 = await spotifyFetch(
    `/search?q=${query1}&type=album&limit=3`,
    {},
    clientId
  );
  if (response1.ok) {
    const data1 = await response1.json();
    const best1 = findBestMatch(data1.albums?.items || [], artist, album);
    if (best1) return best1;
  }

  const query2 = encodeURIComponent(`${album} ${artist}`);
  const response2 = await spotifyFetch(
    `/search?q=${query2}&type=album&limit=5`,
    {},
    clientId
  );
  if (response2.ok) {
    const data2 = await response2.json();
    const best2 = findBestMatch(data2.albums?.items || [], artist, album);
    if (best2) return best2;
  }

  return null;
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function findBestMatch(
  albums: SpotifyAlbum[],
  artist: string,
  album: string
): SpotifyAlbum | null {
  const normArtist = normalize(artist);
  const normAlbum = normalize(album);

  let bestAlbum: SpotifyAlbum | null = null;
  let bestScore = 0;

  for (const a of albums) {
    let score = 0;
    const albumArtists = a.artists.map((ar) => normalize(ar.name));
    const albumName = normalize(a.name);

    if (
      albumArtists.some(
        (ar) => ar.includes(normArtist) || normArtist.includes(ar)
      )
    ) {
      score += 3;
    }

    if (albumName === normAlbum) score += 3;
    else if (albumName.includes(normAlbum) || normAlbum.includes(albumName))
      score += 2;

    if (a.album_type === "album") score += 1;

    if (score > bestScore) {
      bestScore = score;
      bestAlbum = a;
    }
  }

  return bestScore >= 3 ? bestAlbum : null;
}

export async function getAllAlbumTracks(
  albumId: string,
  clientId: string
): Promise<string[]> {
  const trackUris: string[] = [];
  let offset = 0;
  const limit = 50;

  while (true) {
    const response = await spotifyFetch(
      `/albums/${albumId}/tracks?limit=${limit}&offset=${offset}`,
      {},
      clientId
    );
    if (!response.ok) throw new Error("Failed to fetch album tracks");
    const data = await response.json();

    for (const track of data.items) trackUris.push(track.uri);

    if (data.items.length < limit || !data.next) break;
    offset += limit;
  }

  return trackUris;
}

export async function addTracksToPlaylist(
  playlistId: string,
  uris: string[],
  clientId: string
): Promise<void> {
  const uniqueUris = [...new Set(uris)];

  for (let i = 0; i < uniqueUris.length; i += 100) {
    const batch = uniqueUris.slice(i, i + 100);

    console.log(
      `[ADD] batch ${Math.floor(i / 100) + 1}/${Math.ceil(uniqueUris.length / 100)} (${
        batch.length
      } tracks)`
    );

    const response = await spotifyFetch(
      `/playlists/${playlistId}/tracks`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uris: batch }),
      },
      clientId
    );

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(
        `Failed to add tracks to playlist (status ${response.status}) ${body}`
      );
    }
  }
}

// ============ Async Pool for Concurrency ============

export async function asyncPool<T, R>(
  poolLimit: number,
  items: T[],
  iteratorFn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  const executing = new Set<Promise<void>>();

  for (let i = 0; i < items.length; i++) {
    const p = Promise.resolve()
      .then(() => iteratorFn(items[i], i))
      .then((result) => {
        results[i] = result;
      })
      .finally(() => {
        executing.delete(p);
      });

    executing.add(p);

    if (executing.size >= poolLimit) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
  return results;
}

// ============ Input Parsing ============

export function parseAlbumList(input: string): ParsedLine[] {
  const lines = input.split("\n").filter((line) => line.trim());
  const results: ParsedLine[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(/^(.+?)[\s]*[-–—][\s]*(.+)$/);

    if (match) {
      results.push({
        original: trimmed,
        artist: match[1].trim(),
        album: match[2].trim(),
      });
    } else {
      results.push({ original: trimmed, error: "Could not parse" });
    }
  }

  return results;
}

export function parseArtistYearList(input: string): ParsedLineWithYear[] {
  const lines = input.split("\n").filter((line) => line.trim());
  const results: ParsedLineWithYear[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(/^(.+?)[\s]*[-–—][\s]*(\d{4})$/);

    if (match) {
      results.push({
        original: trimmed,
        artist: match[1].trim(),
        year: Number(match[2]),
      });
    } else {
      results.push({
        original: trimmed,
        error: "Could not parse Artist - Year",
      });
    }
  }

  return results;
}
