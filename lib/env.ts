export const redirectUri =
  process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI ??
  "http://127.0.0.1:3000/api/spotify/callback";

export const clientId =
  process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID ??
  "d50fb25bcbd34c069613625c76481d5d";
