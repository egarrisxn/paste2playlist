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
