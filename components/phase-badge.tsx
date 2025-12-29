import { CheckCircle2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ProcessingPhase } from "@/lib/types";

interface PhaseBadgeProps {
  phase: ProcessingPhase;
  current: ProcessingPhase;
  label: string;
}

export default function PhaseBadge({ phase, current, label }: PhaseBadgeProps) {
  const phases: ProcessingPhase[] = [
    "parsing",
    "matching",
    "fetching",
    "creating",
    "adding",
    "done",
  ];
  const phaseIdx = phases.indexOf(phase);
  const currentIdx = phases.indexOf(current);

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
