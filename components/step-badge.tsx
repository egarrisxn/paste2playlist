import { CheckCircle2 } from "lucide-react";

interface StepBadgeProps {
  number: number;
  label: string;
  active: boolean;
  done: boolean;
}

export default function StepBadge({
  number,
  label,
  active,
  done,
}: StepBadgeProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex size-8 items-center justify-center rounded-full text-sm font-medium ${
          done
            ? "bg-[#1DB954] text-white"
            : active
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
        }`}
      >
        {done ? <CheckCircle2 className="size-4" /> : number}
      </div>
      <span
        className={`hidden text-sm sm:inline ${active ? "font-medium" : "text-muted-foreground"}`}
      >
        {label}
      </span>
    </div>
  );
}
