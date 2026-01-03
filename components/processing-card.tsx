import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress as ProgressBar } from "@/components/ui/progress";
import PhaseBadge from "@/components/phase-badge";
import type { ProcessingPhase, MatchResult, Progress } from "@/lib/types";

interface ProcessingCardProps {
  processingPhase: ProcessingPhase;
  progress: Progress;
  matchResults: MatchResult[];
}

export default function ProcessingCard({
  processingPhase,
  progress,
  matchResults,
}: ProcessingCardProps) {
  const pct =
    progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Loader2 className="size-5 animate-spin" />
          Creating Your Playlist
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex flex-wrap justify-center gap-2">
          <PhaseBadge
            phase="parsing"
            current={processingPhase}
            label="Parsing"
          />
          <PhaseBadge
            phase="matching"
            current={processingPhase}
            label="Matching"
          />
          <PhaseBadge
            phase="fetching"
            current={processingPhase}
            label="Fetching"
          />
          <PhaseBadge
            phase="creating"
            current={processingPhase}
            label="Creating"
          />
          <PhaseBadge phase="adding" current={processingPhase} label="Adding" />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="truncate text-muted-foreground">
              {progress.label}
            </span>
            <span className="font-medium">
              {progress.current} / {progress.total}
            </span>
          </div>

          <ProgressBar value={pct} />
        </div>

        {matchResults.length > 0 && (
          <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-border p-2">
            {matchResults.map((result) => {
              const key = result.parsed.original;
              const label = `${result.parsed.artist ?? ""} - ${
                result.parsed.album || result.parsed.original
              }`.trim();

              return (
                <div key={key} className="flex items-center gap-2 text-sm">
                  {result.album ? (
                    <CheckCircle2 className="size-4 shrink-0 text-[#1DB954]" />
                  ) : (
                    <XCircle className="size-4 shrink-0 text-destructive" />
                  )}
                  <span className="truncate">{label}</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
