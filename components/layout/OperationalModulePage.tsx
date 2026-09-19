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
        <section className="bravhas-module-hero">
          <div>
            <p className="bravhas-module-eyebrow">{eyebrow}</p>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
          <div className="bravhas-module-status">{statusText}</div>
        </section>

        {children}
      </div>
    </div>
  );
}
