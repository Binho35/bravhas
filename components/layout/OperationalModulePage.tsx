"use client";

import type { ReactNode } from "react";

interface OperationalModulePageProps {
  eyebrow: string;
  title: string;
  description: string;
  statusText: string;
  children: ReactNode;
}

export function OperationalModulePage({
  eyebrow,
  title,
  description,
  statusText,
  children,
}: OperationalModulePageProps) {
  return (
    <div className="h-full overflow-auto p-3 sm:p-5">
      <div className="mx-auto flex min-h-full w-full max-w-[1600px] flex-col gap-4">
        <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">
              {eyebrow}
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#0B2947]">
              {title}
            </h2>
            <p className="mt-1 max-w-3xl text-sm text-[#64748B]">{description}</p>
          </div>
          <div className="inline-flex min-h-10 items-center rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-2 text-xs font-semibold text-[#154B7A]">
            {statusText}
          </div>
        </section>

        {children}
      </div>
    </div>
  );
}
