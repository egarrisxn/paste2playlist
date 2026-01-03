export const redirectUri = (() => {
  const v = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI;
  if (!v) {
    throw new Error(
      "Missing NEXT_PUBLIC_SPOTIFY_REDIRECT_URI. Check .env.local or deployment env."
    );
  }
  return v;
})();

export const clientId = (() => {
  const v = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  if (!v) {
    throw new Error(
      "Missing NEXT_PUBLIC_SPOTIFY_CLIENT_ID. Check .env.local or deployment env."
    );
  }
  return v;
})();

// function requirePublicEnv(name: string): string {
//   const v = process.env[name];
//   if (!v) {
//     throw new Error(`Missing ${name}. Check .env.local or deployment env.`);
//   }
//   return v;
// }

// export const SPOTIFY_REDIRECT_URI = requirePublicEnv(
//   "NEXT_PUBLIC_SPOTIFY_REDIRECT_URI"
// );

// export const SPOTIFY_CLIENT_ID = requirePublicEnv(
//   "NEXT_PUBLIC_SPOTIFY_CLIENT_ID"
// );

// export const redirectUri = SPOTIFY_REDIRECT_URI;
// export const clientId = SPOTIFY_CLIENT_ID;
