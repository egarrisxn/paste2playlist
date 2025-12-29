//! ============ General Types ============

export type Step = "connect" | "input" | "processing" | "results";

export type ProcessingPhase =
  | "parsing"
  | "matching"
  | "fetching"
  | "creating"
  | "adding"
  | "done";

export interface Progress {
  current: number;
  total: number;
  label: string;
}

//! ============ Error Handling ============

export interface AppError {
  error: Error;
  reset: () => void;
}

//! ============ Token Store (localStorage) ============

export interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  token_type: string;
  scope: string;
}

//! ============ Spotify Data ============

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
  album_type: string;
  external_urls: { spotify: string };
  images: { url: string }[];
}

export interface ParsedLine {
  original: string;
  artist?: string;
  album?: string;
  error?: string;
}

export interface MatchResult {
  parsed: ParsedLine;
  album?: SpotifyAlbum;
  error?: string;
}

//! ============ Auth Flow ============

export type AuthSnapshot = {
  isConnected: boolean;
  profile: SpotifyProfile | null;
  step: Step;
};
