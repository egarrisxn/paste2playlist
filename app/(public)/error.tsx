"use client";

import { useEffect } from "react";
import ErrorSection from "@/components/error-section";
import type { AppError } from "@/lib/types";

export default function Error({ error, reset }: AppError) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <ErrorSection onClick={() => reset()} />
    </>
  );
}
