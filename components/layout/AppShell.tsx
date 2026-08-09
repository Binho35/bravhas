import type { ReactNode } from "react";

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
  return (
    <div className="h-screen overflow-hidden bg-[#F7F9FC] text-[#0F172A]">
      <div className="flex h-full">
        <aside className="h-full w-64 shrink-0 bg-[#0B2947]">
          {sidebar}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="h-16 shrink-0 border-b border-[#E2E8F0] bg-white">
            {header}
          </header>

          <main className="min-h-0 flex-1 overflow-hidden">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}