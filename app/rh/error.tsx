"use client";

import { HrdpErrorState } from "@/components/hrdp/HrdpErrorState";

export default function RhError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <HrdpErrorState error={error} reset={reset} area="RH" />;
}
