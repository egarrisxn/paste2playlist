"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, XCircle, Disc3 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { exchangeCodeForToken, getMe } from "@/lib/spotify";
import { clientId, redirectUri } from "@/lib/env";

type Status = "loading" | "error";

function clearAuthSessionStorage() {
  sessionStorage.removeItem("spotify_code_verifier");
  sessionStorage.removeItem("spotify_auth_state");
}

export default function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    async function run() {
      if (error) {
        setStatus("error");
        setErrorMessage(
          error === "access_denied"
            ? "Authorization was cancelled."
            : `Spotify error: ${error}`
        );
        clearAuthSessionStorage();
        return;
      }

      if (!code) {
        setStatus("error");
        setErrorMessage("No authorization code received from Spotify.");
        clearAuthSessionStorage();
        return;
      }

      const storedState = sessionStorage.getItem("spotify_auth_state");
      if (!storedState || state !== storedState) {
        setStatus("error");
        setErrorMessage("State mismatch. Please try connecting again.");
        clearAuthSessionStorage();
        return;
      }

      const verifier = sessionStorage.getItem("spotify_code_verifier");
      if (!verifier) {
        setStatus("error");
        setErrorMessage("Missing code verifier. Please try connecting again.");
        clearAuthSessionStorage();
        return;
      }

      try {
        await exchangeCodeForToken(code, verifier, redirectUri, clientId);

        await getMe(clientId);

        clearAuthSessionStorage();
        router.push("/");
      } catch (err) {
        setStatus("error");
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Failed to complete authentication."
        );
        clearAuthSessionStorage();
      }
    }

    void run();
  }, [searchParams, router]);

  if (status === "loading") {
    return (
      <div className="mx-auto flex min-h-screen w-full flex-col items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-[#1DB954]/10">
              <Disc3 className="size-6 text-[#1DB954]" />
            </div>
            <CardTitle>Finishing Spotify Login</CardTitle>
            <CardDescription>
              Please wait while we complete your authentication...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader2 className="size-8 animate-spin text-[#1DB954]" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full flex-col items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-[#1DB954]/10">
            <Disc3 className="size-6 text-[#1DB954]" />
          </div>
          <CardTitle>Connection Failed</CardTitle>
          <CardDescription>{errorMessage}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div className="flex flex-col items-center gap-4">
            <XCircle className="size-8 text-destructive" />
            <Button onClick={() => router.push("/")} variant="outline">
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
