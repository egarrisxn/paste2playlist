import { CheckCircle2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ProcessingPhase } from "@/lib/types";

interface PhaseBadgeProps {
  phase: ProcessingPhase;
  current: ProcessingPhase;
  label: string;
}

const PHASES: ProcessingPhase[] = [
  "parsing",
  "matching",
  "fetching",
  "creating",
  "adding",
  "done",
];

export default function PhaseBadge({ phase, current, label }: PhaseBadgeProps) {
  const phaseIdx = PHASES.indexOf(phase);
  const currentIdx = PHASES.indexOf(current);

  const isDone = phaseIdx < currentIdx;
  const isActive = phase === current;

  return (
    <Badge
      variant={isDone ? "default" : isActive ? "secondary" : "outline"}
      className={isDone ? "bg-[#1DB954]" : ""}
    >
      {isDone && <CheckCircle2 className="mr-1 size-3" />}
      {isActive && <Loader2 className="mr-1 size-3 animate-spin" />}
      {label}
    </Badge>
  );
}
