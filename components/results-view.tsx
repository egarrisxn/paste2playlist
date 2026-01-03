import { CheckCircle2, ExternalLink, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { MatchResult } from "@/lib/types";

interface ResultsViewProps {
  matchResults: MatchResult[];
  playlistUrl: string;
  totalTracks: number;
  createAnotherHref: string;
}

export default function ResultsView({
  matchResults,
  playlistUrl,
  totalTracks,
  createAnotherHref,
}: ResultsViewProps) {
  const matched = matchResults.filter((r) => r.album);
  const failed = matchResults.filter((r) => r.error);

  const successCount = matched.length;
  const failedCount = failed.length;

  return (
    <div className="space-y-6">
      <Card className="border-[#1DB954]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#1DB954]">
            <CheckCircle2 className="size-6" />
            Playlist Created!
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm text-muted-foreground">Albums Matched</p>
              <p className="text-2xl font-bold">{successCount}</p>
            </div>

            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm text-muted-foreground">Tracks Added</p>
              <p className="text-2xl font-bold">{totalTracks}</p>
            </div>

            {failedCount > 0 && (
              <div className="rounded-lg bg-destructive/10 p-3">
                <p className="text-sm text-destructive">Failed</p>
                <p className="text-2xl font-bold text-destructive">
                  {failedCount}
                </p>
              </div>
            )}
          </div>

          <Button
            asChild
            className="w-full bg-[#1DB954] text-white hover:bg-[#1ed760]"
          >
            <a href={playlistUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 size-4" />
              Open Playlist in Spotify
            </a>
          </Button>
        </CardContent>
      </Card>

      {successCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Matched Albums ({successCount})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {matched.map((result) => {
                const album = result.album!;
                const key = `${album.id}:${result.parsed.original}`;

                const img = album.images?.[2]?.url ?? album.images?.[0]?.url;

                return (
                  <div
                    key={key}
                    className="flex items-center gap-3 rounded-md p-2 hover:bg-muted"
                  >
                    {img && (
                      <img
                        src={img || "/placeholder.svg"}
                        alt={album.name}
                        className="size-10 rounded"
                      />
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{album.name}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {album.artists.map((a) => a.name).join(", ")}
                      </p>
                    </div>

                    <a
                      href={album.external_urls.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                      aria-label="Open album in Spotify"
                    >
                      <ExternalLink className="size-4" />
                    </a>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {failedCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-destructive">
              Failed Items ({failedCount})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {failed.map((result) => (
                <div
                  key={result.parsed.original}
                  className="flex items-start gap-2 rounded-md bg-destructive/5 p-2 text-sm"
                >
                  <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                  <div>
                    <p className="font-medium">{result.parsed.original}</p>
                    <p className="text-muted-foreground">{result.error}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Button asChild variant="outline" className="w-full">
        <a href={createAnotherHref}>Create Another Playlist</a>
      </Button>
    </div>
  );
}
