"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";

interface AppShellProps {
  sidebar: ReactNode;
  header: ReactNode;
  children: ReactNode;
}

export function AppShell({
  sidebar,
  header,
  children,
}: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigationId = useId();

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  return (
    <div className="h-dvh overflow-hidden bg-[#F7F9FC] text-[#0F172A]">
      <div className="flex h-full">
        <aside className="hidden h-full w-64 shrink-0 bg-[#0B2947] lg:block">
          {sidebar}
        </aside>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Fechar menu de navegação"
              className="absolute inset-0 bg-slate-950/45 backdrop-blur-[1px]"
              onClick={() => setMobileMenuOpen(false)}
            />

            <aside
              id={navigationId}
              role="dialog"
              aria-modal="true"
              aria-label="Navegação principal"
              className="relative h-full w-[min(20rem,88vw)] bg-[#0B2947] shadow-2xl"
            >
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={() => setMobileMenuOpen(false)}
                className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                <X size={20} aria-hidden="true" />
              </button>
              {sidebar}
            </aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="relative h-16 shrink-0 border-b border-[#E2E8F0] bg-white">
            <button
              type="button"
              aria-label="Abrir menu de navegação"
              aria-expanded={mobileMenuOpen}
              aria-controls={navigationId}
              onClick={() => setMobileMenuOpen(true)}
              className="absolute left-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-[#154B7A] shadow-sm transition hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#154B7A]/30 lg:hidden"
            >
              <Menu size={20} aria-hidden="true" />
            </button>
            <div className="h-full pl-14 lg:pl-0">{header}</div>
          </header>

          <main className="min-h-0 min-w-0 flex-1 overflow-hidden">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
