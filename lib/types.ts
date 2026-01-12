export type Setter<T> = (v: T | ((prev: T) => T)) => void;

export type Status = "loading" | "error";

export type Step = "connect" | "input" | "processing" | "results";

export type ProcessingPhase =
  | "parsing"
  | "matching"
  | "fetching"
  | "creating"
  | "adding"
  | "done";

export type InputMode = "album" | "year";

export interface Progress {
  current: number;
  total: number;
  label: string;
}

// ============ Error Handling ============

export interface AppError {
  error: Error;
  reset: () => void;
}

// ============ Token Store (localStorage) ============

export interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  token_type: string;
  scope: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

// ============ Spotify API Data ============

export interface SpotifyProfile {
  id: string;
  display_name: string;
  email?: string;
  images?: { url: string }[];
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  artists: { name: string }[];
  album_type: string; // "album" | "single" | ...
  external_urls: { spotify: string };
  images: { url: string }[];
  release_date?: string;
  release_date_precision?: string;
}

export interface ParsedLine {
  original: string;
  artist?: string;
  album?: string;
  year?: number;
  error?: string;
}

// Kept for compatibility with your imports, but ParsedLine already supports year
export interface ParsedLineWithYear extends ParsedLine {
  year?: number;
}

export interface MatchResult {
  parsed: ParsedLine;
  album?: SpotifyAlbum;
  error?: string;
}

// ============ Auth Flow ============

export type AuthSnapshot = {
  isConnected: boolean;
  profile: SpotifyProfile | null;
  step: Step;
};
