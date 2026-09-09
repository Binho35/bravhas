"use client";

import { useFormStatus } from "react-dom";

export function ServerSubmitButton({
  children,
  idleLabel,
  pendingLabel = "Salvando...",
  className = "",
}: {
  children: React.ReactNode;
  idleLabel?: string;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} aria-disabled={pending} className={`${className} disabled:cursor-not-allowed disabled:opacity-60`}>{pending ? pendingLabel : <>{children}{idleLabel}</>}</button>;
}
