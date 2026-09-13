"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
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
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const navigationRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = navigationRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );

      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      menuTriggerRef.current?.focus();
    };
  }, [mobileMenuOpen]);

  return (
    <div className="h-dvh overflow-hidden bg-[#F3F6FA] text-[#102A43]">
      <div className="flex h-full">
        <aside className="hidden h-full w-72 shrink-0 bg-[#081F35] lg:block">
          {sidebar}
        </aside>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Fechar menu de navegação"
              className="absolute inset-0 bg-[#071827]/60 backdrop-blur-[2px]"
              onClick={() => setMobileMenuOpen(false)}
            />

            <aside
              ref={navigationRef}
              id={navigationId}
              role="dialog"
              aria-modal="true"
              aria-label="Navegação principal"
              className="relative h-full w-[min(19rem,86vw)] overflow-hidden bg-[#081F35] shadow-[24px_0_70px_-30px_rgba(2,12,22,0.85)]"
            >
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Fechar menu"
                onClick={() => setMobileMenuOpen(false)}
                className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                <X size={20} aria-hidden="true" />
              </button>
              {sidebar}
            </aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="relative h-[72px] shrink-0 border-b border-[#DDE6EE] bg-white/95 backdrop-blur-sm">
            <button
              ref={menuTriggerRef}
              type="button"
              aria-label="Abrir menu de navegação"
              aria-expanded={mobileMenuOpen}
              aria-controls={navigationId}
              onClick={() => setMobileMenuOpen(true)}
              className="absolute left-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-2xl border border-[#DCE6F0] bg-white text-[#154B7A] shadow-sm transition hover:bg-[#F5F8FB] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2C7DB6]/15 lg:hidden"
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
