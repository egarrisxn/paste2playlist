"use client";

import ErrorSection from "@/components/error-section";
import type { AppError } from "@/lib/types";

export default function GlobalError({ reset }: AppError) {
  return (
    <html>
      <body>
        <div className="mx-auto grid min-h-dvh w-full place-items-center px-4">
          <section className="grid px-4">
            <ErrorSection onClick={() => reset()} />
          </section>
        </div>
      </body>
    </html>
  );
}
