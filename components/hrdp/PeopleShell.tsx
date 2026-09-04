"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  BadgeCheck,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  FileHeart,
  FileWarning,
  HeartHandshake,
  LayoutDashboard,
  Menu,
  MessageSquareText,
  Network,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  UserMinus,
  UserRoundCog,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";

const rhNavigation = [
  { label: "Visão geral", href: "/pessoas", icon: LayoutDashboard },
  { label: "RH", href: "/rh", icon: HeartHandshake },
  { label: "Colaboradores", href: "/rh/colaboradores", icon: UsersRound },
  { label: "Admissões", href: "/rh/admissoes", icon: BadgeCheck },
  { label: "Recrutamento", href: "/rh/recrutamento", icon: BriefcaseBusiness },
  { label: "Desempenho", href: "/rh/desempenho", icon: Sparkles },
  { label: "Canal RH", href: "/rh/canal-rh", icon: MessageSquareText },
  { label: "Organização", href: "/rh/organizacao", icon: Network },
  { label: "Relatórios", href: "/rh/relatorios", icon: ReceiptText },
];

const dpNavigation = [
  { label: "DP", href: "/dp", icon: UserRoundCog },
  { label: "Ponto e jornada", href: "/dp/ponto", icon: ClipboardCheck },
  { label: "Férias", href: "/dp/ferias", icon: CalendarDays },
  { label: "Benefícios", href: "/dp/beneficios", icon: WalletCards },
  { label: "Folha", href: "/dp/folha", icon: ReceiptText },
  { label: "Afastamentos", href: "/dp/afastamentos", icon: FileHeart },
  { label: "Medidas disciplinares", href: "/dp/medidas-disciplinares", icon: FileWarning },
  { label: "Desligamentos", href: "/dp/desligamentos", icon: UserMinus },
];

type NavigationItem = (typeof rhNavigation)[number];

function isActivePath(pathname: string, href: string) {
  if (href === "/pessoas" || href === "/rh" || href === "/dp") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavigationGroup({ title, items, pathname, onNavigate }: { title: string; items: NavigationItem[]; pathname: string; onNavigate?: () => void }) {
  return (
    <div>
      <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <nav className="mt-2 space-y-0.5" aria-label={title}>
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`group flex min-h-11 items-center gap-3 rounded-2xl px-3 py-2 text-[13px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${active ? "bg-white/12 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
            >
              <Icon className={`h-[17px] w-[17px] transition ${active ? "text-blue-200" : "text-blue-300 group-hover:text-white"}`} aria-hidden="true" />
              <span className="flex-1">{item.label}</span>
              <ChevronRight className={`h-3.5 w-3.5 transition ${active ? "opacity-70" : "opacity-0 group-hover:opacity-70"}`} aria-hidden="true" />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function NavigationContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      <div className="border-b border-white/10 px-6 py-6">
        <Link href="/pessoas" onClick={onNavigate} className="flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#154b7a] shadow-lg shadow-black/10"><Building2 className="h-5 w-5" aria-hidden="true" /></div>
          <div><p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-200">BravHAS</p><p className="mt-1 text-base font-bold">Pessoas</p></div>
        </Link>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5">
        <NavigationGroup title="Recursos Humanos" items={rhNavigation} pathname={pathname} onNavigate={onNavigate} />
        <div className="h-px bg-white/10" />
        <NavigationGroup title="Departamento Pessoal" items={dpNavigation} pathname={pathname} onNavigate={onNavigate} />
      </div>
      <div className="p-4">
        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4 text-emerald-300" aria-hidden="true" />Ambiente corporativo</div>
          <p className="mt-2 text-xs leading-5 text-slate-400">Acessos por perfil, trilha de auditoria e proteção de dados sensíveis.</p>
        </div>
      </div>
    </>
  );
}

export function PeopleShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigationId = useId();
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);

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
      const focusable = drawerRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
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
    <div className="min-h-screen bg-[#f4f7fb] text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-[1680px]">
        <aside className="hidden w-[286px] shrink-0 border-r border-white/10 bg-[#071d33] text-white xl:flex xl:flex-col">
          <NavigationContent pathname={pathname} />
        </aside>

        {mobileMenuOpen ? (
          <div className="fixed inset-0 z-50 xl:hidden">
            <button type="button" aria-label="Fechar navegação de Pessoas" onClick={() => setMobileMenuOpen(false)} className="absolute inset-0 bg-slate-950/45 backdrop-blur-[1px]" />
            <aside ref={drawerRef} id={navigationId} role="dialog" aria-modal="true" aria-label="Navegação de RH e Departamento Pessoal" className="relative flex h-full w-[min(21rem,90vw)] flex-col bg-[#071d33] text-white shadow-2xl">
              <button ref={closeButtonRef} type="button" aria-label="Fechar menu de Pessoas" onClick={() => setMobileMenuOpen(false)} className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"><X className="h-5 w-5" aria-hidden="true" /></button>
              <NavigationContent pathname={pathname} onNavigate={() => setMobileMenuOpen(false)} />
            </aside>
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur md:px-7">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2 xl:hidden">
                <button ref={menuTriggerRef} type="button" aria-label="Abrir navegação de Pessoas" aria-expanded={mobileMenuOpen} aria-controls={navigationId} onClick={() => setMobileMenuOpen(true)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-[#0b2947] shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#154b7a]/40"><Menu className="h-5 w-5" aria-hidden="true" /></button>
                <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-700">BravHAS</p><p className="truncate text-sm font-bold text-slate-900">Pessoas</p></div>
              </div>

              <div className="hidden md:block"><p className="text-xs font-medium text-slate-500">BravHAS · ambiente multiempresa</p><p className="mt-0.5 text-sm font-semibold text-slate-900">Central de RH & Departamento Pessoal</p></div>

              <div className="flex shrink-0 items-center gap-2">
                <button type="button" aria-label="Notificações" className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#154b7a]/40"><Bell className="h-[18px] w-[18px]" aria-hidden="true" /><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" aria-hidden="true" /></button>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-2 py-2 shadow-sm sm:px-3"><div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#eaf3fb] text-xs font-bold text-[#0b2947]">RH</div><div className="hidden sm:block"><p className="text-xs font-semibold text-slate-900">Administração</p><p className="text-[11px] text-slate-500">RH & DP</p></div></div>
              </div>
            </div>
          </header>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
