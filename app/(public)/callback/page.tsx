import { Suspense } from "react";
import LoadingState from "@/components/loading-state";
import CallbackHandler from "@/blocks/callback-handler";

export default function CallbackPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <CallbackHandler />
    </Suspense>
  );
}
