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
    <div className="bravhas-shell h-dvh overflow-hidden text-[#10243A]">
      <div className="flex h-full">
        <aside className="bravhas-desktop-sidebar hidden h-full w-[276px] shrink-0 lg:block">
          {sidebar}
        </aside>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Fechar menu de navegação"
              className="absolute inset-0 bg-slate-950/30 backdrop-blur-[2px]"
              onClick={() => setMobileMenuOpen(false)}
            />

            <aside
              ref={navigationRef}
              id={navigationId}
              role="dialog"
              aria-modal="true"
              aria-label="Navegação principal"
              className="bravhas-mobile-drawer relative h-full w-[min(20rem,88vw)] shadow-2xl"
            >
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Fechar menu"
                onClick={() => setMobileMenuOpen(false)}
                className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-xl border border-[#DCE7EF] bg-white text-[#36536A] transition hover:bg-[#F4F8FB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4AADE2]/30"
              >
                <X size={19} aria-hidden="true" />
              </button>
              {sidebar}
            </aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="bravhas-topbar relative h-[70px] shrink-0">
            <button
              ref={menuTriggerRef}
              type="button"
              aria-label="Abrir menu de navegação"
              aria-expanded={mobileMenuOpen}
              aria-controls={navigationId}
              onClick={() => setMobileMenuOpen(true)}
              className="absolute left-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl border border-[#DCE7EF] bg-white text-[#247DAF] shadow-sm transition hover:bg-[#F4F9FC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4AADE2]/30 lg:hidden"
            >
              <Menu size={19} aria-hidden="true" />
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
