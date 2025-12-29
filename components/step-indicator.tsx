import StepBadge from "@/components/step-badge";
import type { Step } from "@/lib/types";

interface StepIndicatorProps {
  step: Step;
  isConnected: boolean;
}

export default function StepIndicator({
  step,
  isConnected,
}: StepIndicatorProps) {
  return (
    <div className="mb-8 flex items-center justify-center gap-2">
      <StepBadge
        number={1}
        label="Connect"
        active={step === "connect"}
        done={isConnected}
      />
      <div className="h-px w-8 bg-border" />
      <StepBadge
        number={2}
        label="Paste List"
        active={step === "input"}
        done={step === "processing" || step === "results"}
      />
      <div className="h-px w-8 bg-border" />
      <StepBadge
        number={3}
        label="Create"
        active={step === "processing" || step === "results"}
        done={step === "results"}
      />
    </div>
  );
}
