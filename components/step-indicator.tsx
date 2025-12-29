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
    <div className="mb-8 grid grid-cols-3 gap-4 sm:gap-5">
      <StepBadge
        number={1}
        label="Log in with Spotify"
        description="Connect your Spotify account"
        active={step === "connect"}
        done={isConnected}
      />

      <StepBadge
        number={2}
        label="Paste an Albums List"
        description="One per line: Artist - Album"
        active={step === "input"}
        done={step === "processing" || step === "results"}
      />

      <StepBadge
        number={3}
        label="Generate New Playlist"
        description="All tracks added automatically"
        active={step === "processing" || step === "results"}
        done={step === "results"}
      />
    </div>
  );
}
