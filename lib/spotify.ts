import type {
  TokenData,
  SpotifyProfile,
  SpotifyAlbum,
  ParsedLine,
} from "./types";

// Spotify PKCE Auth + API utilities for Paste2Playlist
// All client-side - no server required

const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

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
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return crypto.subtle.digest("SHA-256", data);
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

// export interface TokenData {
//   access_token: string
//   refresh_token: string
//   expires_at: number
//   token_type: string
//   scope: string
// }

// export interface SpotifyProfile {
//   id: string
//   display_name: string
//   email?: string
//   images?: { url: string }[]
// }

const TOKEN_KEY = "paste2playlist_token";
const PROFILE_KEY = "paste2playlist_profile";

export function getToken(): TokenData | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(TOKEN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setToken(tokenResponse: {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}): void {
  const data: TokenData = {
    access_token: tokenResponse.access_token,
    refresh_token: tokenResponse.refresh_token,
    expires_at: Date.now() + tokenResponse.expires_in * 1000,
    token_type: tokenResponse.token_type,
    scope: tokenResponse.scope,
  };
  localStorage.setItem(TOKEN_KEY, JSON.stringify(data));
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(PROFILE_KEY);
}

export function getStoredProfile(): SpotifyProfile | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredProfile(profile: SpotifyProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function isTokenExpired(): boolean {
  const token = getToken();
  if (!token) return true;
  // Add 60s buffer
  return Date.now() > token.expires_at - 60000;
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
    state: state,
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
    code: code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
  });

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const data = await response.json();
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

  if (!response.ok) {
    throw new Error("Token refresh failed");
  }

  const data = await response.json();
  // Spotify may or may not return a new refresh_token
  setToken({
    ...data,
    refresh_token: data.refresh_token || refreshToken,
  });
  return getToken()!;
}

// ============ API Wrapper with Auto-Refresh ============

let isRefreshing = false;

export async function spotifyFetch(
  path: string,
  options: RequestInit = {},
  clientId: string
): Promise<Response> {
  let token = getToken();

  if (!token) {
    throw new Error("Not authenticated");
  }

  // Check if token is expired and refresh if needed
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

  let response = await fetch(`${SPOTIFY_API_BASE}${path}`, {
    ...options,
    headers,
  });

  // Handle rate limiting
  if (response.status === 429) {
    const retryAfter = Number.parseInt(
      response.headers.get("Retry-After") || "1",
      10
    );
    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
    response = await fetch(`${SPOTIFY_API_BASE}${path}`, {
      ...options,
      headers,
    });
  }

  // Handle 401 - try refresh once
  if (response.status === 401 && !isRefreshing) {
    isRefreshing = true;
    try {
      token = await refreshAccessToken(token.refresh_token, clientId);
      headers.set("Authorization", `Bearer ${token.access_token}`);
      response = await fetch(`${SPOTIFY_API_BASE}${path}`, {
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
  if (!response.ok) throw new Error("Failed to fetch profile");
  const profile = await response.json();
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
      body: JSON.stringify({
        name,
        description,
        public: isPublic,
      }),
    },
    clientId
  );
  if (!response.ok) throw new Error("Failed to create playlist");
  return response.json();
}

// export interface SpotifyAlbum {
//   id: string
//   name: string
//   artists: { name: string }[]
//   album_type: string
//   external_urls: { spotify: string }
//   images: { url: string }[]
// }

export async function searchAlbum(
  artist: string,
  album: string,
  clientId: string
): Promise<SpotifyAlbum | null> {
  // Attempt 1: Structured search
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

  // Attempt 2: Relaxed search
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

    // Artist match
    if (
      albumArtists.some(
        (ar) => ar.includes(normArtist) || normArtist.includes(ar)
      )
    ) {
      score += 3;
    }

    // Album name match
    if (albumName === normAlbum) {
      score += 3;
    } else if (albumName.includes(normAlbum) || normAlbum.includes(albumName)) {
      score += 2;
    }

    // Prefer full albums
    if (a.album_type === "album") {
      score += 1;
    }

    if (score > bestScore) {
      bestScore = score;
      bestAlbum = a;
    }
  }

  // Require minimum score of 3 for a good match
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

    for (const track of data.items) {
      trackUris.push(track.uri);
    }

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
  // Dedupe URIs
  const uniqueUris = [...new Set(uris)];

  // Add in batches of 100
  for (let i = 0; i < uniqueUris.length; i += 100) {
    const batch = uniqueUris.slice(i, i + 100);
    const response = await spotifyFetch(
      `/playlists/${playlistId}/tracks`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uris: batch }),
      },
      clientId
    );
    if (!response.ok) throw new Error("Failed to add tracks to playlist");
  }
}

// ============ Async Pool for Concurrency ============

export async function asyncPool<T, R>(
  poolLimit: number,
  items: T[],
  iteratorFn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  const executing: Promise<void>[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const p = Promise.resolve()
      .then(() => iteratorFn(item, i))
      .then((result) => {
        results[i] = result;
      });

    executing.push(p as unknown as Promise<void>);

    if (executing.length >= poolLimit) {
      await Promise.race(executing);
      executing.splice(
        executing.findIndex((e) => e === p),
        1
      );
    }
  }

  await Promise.all(executing);
  return results;
}

// ============ Input Parsing ============

// export interface ParsedLine {
//   original: string
//   artist?: string
//   album?: string
//   error?: string
// }

export function parseAlbumList(input: string): ParsedLine[] {
  const lines = input.split("\n").filter((line) => line.trim());
  const results: ParsedLine[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Match various dash types: - – —
    const match = trimmed.match(/^(.+?)[\s]*[-–—][\s]*(.+)$/);

    if (match) {
      results.push({
        original: trimmed,
        artist: match[1].trim(),
        album: match[2].trim(),
      });
    } else {
      results.push({
        original: trimmed,
        error: "Could not parse",
      });
    }
  }

  return results;
}
