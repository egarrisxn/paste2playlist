import { Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function SetupAlert() {
  return (
    <Alert className="mb-6">
      <Info className="size-4" />
      <AlertTitle>Setup Required</AlertTitle>
      <AlertDescription>
        <p className="mb-2">
          To use Paste2Playlist, configure these environment variables:
        </p>
        <ul className="list-disc pl-4 text-sm">
          <li>
            <code className="rounded bg-muted px-1">
              NEXT_PUBLIC_SPOTIFY_CLIENT_ID
            </code>{" "}
            - Your Spotify App Client ID
          </li>
          <li>
            <code className="rounded bg-muted px-1">
              NEXT_PUBLIC_SPOTIFY_REDIRECT_URI
            </code>{" "}
            - Your App Callback URL <br />
            (e.g.,{" "}
            <code className="rounded bg-muted px-1">
              https://your-domain.com/callback
            </code>
            )
          </li>
        </ul>
        <p className="mt-2 text-sm text-muted-foreground">
          Add the redirect URI in your Spotify Developer Dashboard exactly as
          configured above.
          <br />
          <strong>Note:</strong> Spotify no longer allows <code>localhost</code>{" "}
          as a callback — use your deployed URL.
        </p>
      </AlertDescription>
    </Alert>
  );
}
