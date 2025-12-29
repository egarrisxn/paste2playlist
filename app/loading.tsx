import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="mx-auto grid min-h-dvh w-full place-items-center">
      <section className="grid px-4">
        <div className="flex w-full flex-row items-center justify-center gap-3">
          <Loader2 className="size-6 animate-spin text-primary" />
          <p className="text-lg font-semibold">Loading...</p>
        </div>
      </section>
    </div>
  );
}
