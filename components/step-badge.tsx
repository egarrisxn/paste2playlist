import { CheckCircle2 } from "lucide-react";

interface StepBadgeProps {
  number: number;
  label: string;
  description?: string;
  active: boolean;
  done: boolean;
}

export default function StepBadge({
  number,
  label,
  description,
  active,
  done,
}: StepBadgeProps) {
  return (
    <div className="mb-8 flex flex-col items-center gap-1.5 sm:gap-2">
      <div
        className={`flex size-10 items-center justify-center rounded-full text-sm font-medium sm:size-12 ${
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
        className={`pt-1 text-center text-xs sm:text-sm ${active ? "font-extrabold" : "font-semibold text-muted-foreground"}`}
      >
        {label}
      </span>
      <span
        className={`text-center text-xs sm:text-sm ${active ? "font-medium" : "font-medium text-muted-foreground/60"}`}
      >
        {description}
      </span>
    </div>
  );
}
