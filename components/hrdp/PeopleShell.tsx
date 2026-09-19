"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
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

function NavigationGroup({
  title,
  items,
  pathname,
  onNavigate,
}: {
  title: string;
  items: NavigationItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <section className="bravhas-people-nav-section">
      <p>{title}</p>
      <nav className="mt-2 space-y-1" aria-label={title}>
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`bravhas-people-nav-link ${active ? "is-active" : ""}`}
            >
              <span className="bravhas-people-nav-icon">
                <Icon className="h-[17px] w-[17px]" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              <ChevronRight className="h-3.5 w-3.5 opacity-40" aria-hidden="true" />
            </Link>
          );
        })}
      </nav>
    </section>
  );
}

function NavigationContent({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="bravhas-people-brand">
        <Link
          href="/pessoas"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4AADE2]/30"
        >
          <span className="bravhas-people-brandmark">
            <Building2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>
            <strong>Brav<span>HAS</span></strong>
            <small>Pessoas & DP</small>
          </span>
        </Link>
      </div>

      <div className="bravhas-people-context">
        <span>People operations</span>
        <strong>RH e Departamento Pessoal</strong>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        <NavigationGroup
          title="Recursos Humanos"
          items={rhNavigation}
          pathname={pathname}
          onNavigate={onNavigate}
        />
        <NavigationGroup
          title="Departamento Pessoal"
          items={dpNavigation}
          pathname={pathname}
          onNavigate={onNavigate}
        />
      </div>

      <div className="bravhas-people-sidebar-footer">
        <Link href="/" onClick={onNavigate} className="bravhas-people-back-link">
          <ArrowLeft size={14} aria-hidden="true" />
          Centro executivo
        </Link>
        <div className="bravhas-people-security">
          <ShieldCheck size={15} aria-hidden="true" />
          <span>
            <strong>Ambiente protegido</strong>
            <small>Perfis, auditoria e dados sensíveis.</small>
          </span>
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
    const menuTrigger = menuTriggerRef.current;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
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
      menuTrigger?.focus();
    };
  }, [mobileMenuOpen]);

  return (
    <div className="bravhas-people-shell min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-[1760px]">
        <aside className="bravhas-people-sidebar hidden w-[282px] shrink-0 xl:flex xl:flex-col">
          <NavigationContent pathname={pathname} />
        </aside>

        {mobileMenuOpen ? (
          <div className="fixed inset-0 z-50 xl:hidden">
            <button
              type="button"
              aria-label="Fechar navegação de Pessoas"
              onClick={() => setMobileMenuOpen(false)}
              className="absolute inset-0 bg-slate-950/30 backdrop-blur-[2px]"
            />
            <aside
              ref={drawerRef}
              id={navigationId}
              role="dialog"
              aria-modal="true"
              aria-label="Navegação de RH e Departamento Pessoal"
              className="bravhas-people-drawer relative flex h-full w-[min(21rem,90vw)] flex-col shadow-2xl"
            >
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Fechar menu de Pessoas"
                onClick={() => setMobileMenuOpen(false)}
                className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-xl border border-[#DCE7EF] bg-white text-[#476276] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4AADE2]/30"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
              <NavigationContent pathname={pathname} onNavigate={() => setMobileMenuOpen(false)} />
            </aside>
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          <header className="bravhas-people-topbar sticky top-0 z-30">
            <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-7">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  ref={menuTriggerRef}
                  type="button"
                  aria-label="Abrir navegação de Pessoas"
                  aria-expanded={mobileMenuOpen}
                  aria-controls={navigationId}
                  onClick={() => setMobileMenuOpen(true)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#DCE7EF] bg-white text-[#277EAF] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4AADE2]/30 xl:hidden"
                >
                  <Menu className="h-5 w-5" aria-hidden="true" />
                </button>
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#4999C2]">
                    BravHAS · Pessoas
                  </p>
                  <p className="mt-0.5 truncate text-sm font-black text-[#173A54]">
                    RH & Departamento Pessoal
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  aria-label="Notificações"
                  className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-[#DCE7EF] bg-white text-[#60788A] shadow-sm"
                >
                  <Bell className="h-[18px] w-[18px]" aria-hidden="true" />
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" aria-hidden="true" />
                </button>
                <div className="bravhas-people-profile">
                  <span>RH</span>
                  <div className="hidden sm:block">
                    <strong>Administração</strong>
                    <small>People operations</small>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="bravhas-people-content min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
