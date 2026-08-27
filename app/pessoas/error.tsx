"use client";

import { HrdpErrorState } from "@/components/hrdp/HrdpErrorState";

export default function PessoasError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <HrdpErrorState error={error} reset={reset} area="Pessoas" />;
}
