"use client";

import type { ElementType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Briefcase,
  CalendarDays,
  ClipboardList,
  FileText,
  LayoutDashboard,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import { usePermission } from "@/modules/auth/hooks/usePermission";

interface MenuItem {
  label: string;
  href: string;
  icon: ElementType;
  allowed: boolean;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export function Sidebar() {
  const pathname = usePathname();

  const canViewDashboard = usePermission("DASHBOARD", "VIEW");
  const canViewObligations = usePermission("OBLIGATIONS", "VIEW");
  const canViewAgenda = usePermission("AGENDA", "VIEW");
  const canViewFinancial = usePermission("FINANCIAL", "VIEW");
  const canViewCashFlow = usePermission("CASH_FLOW", "VIEW");
  const canViewPeople = usePermission("PEOPLE", "VIEW");
  const canViewPayroll = usePermission("PAYROLL", "VIEW");
  const canViewIndicators = usePermission("INDICATORS", "VIEW");
  const canViewDocuments = usePermission("DOCUMENTS", "VIEW");

  const sections: MenuSection[] = [
    {
      title: "CENTRO",
      items: [
        {
          label: "Centro de Controle",
          href: "/",
          icon: LayoutDashboard,
          allowed: canViewDashboard,
        },
      ],
    },
    {
      title: "OPERAÇÃO",
      items: [
        {
          label: "Obrigações",
          href: "/obrigacoes",
          icon: ClipboardList,
          allowed: canViewObligations,
        },
        {
          label: "Agenda",
          href: "/agenda",
          icon: CalendarDays,
          allowed: canViewAgenda,
        },
      ],
    },
    {
      title: "FINANCEIRO",
      items: [
        {
          label: "Financeiro",
          href: "/financeiro",
          icon: Wallet,
          allowed: canViewFinancial,
        },
        {
          label: "Fluxo de Caixa",
          href: "/financeiro/fluxo-caixa",
          icon: TrendingUp,
          allowed: canViewCashFlow,
        },
      ],
    },
    {
      title: "PESSOAS",
      items: [
        {
          label: "Pessoas",
          href: "/pessoas",
          icon: Users,
          allowed: canViewPeople,
        },
        {
          label: "Departamento Pessoal",
          href: "/departamento-pessoal",
          icon: Briefcase,
          allowed: canViewPayroll,
        },
      ],
    },
    {
      title: "GESTÃO",
      items: [
        {
          label: "Indicadores",
          href: "/indicadores",
          icon: BarChart3,
          allowed: canViewIndicators,
        },
        {
          label: "Documentos",
          href: "/documentos",
          icon: FileText,
          allowed: canViewDocuments,
        },
      ],
    },
  ];

  const visibleSections = sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.allowed),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <div className="flex h-full flex-col bg-[#081F35] text-white">
      <div className="border-b border-white/10 px-5 py-5 pr-16 lg:px-6 lg:pr-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-sm font-black text-[#0B2947] shadow-[0_12px_30px_-18px_rgba(255,255,255,0.55)]">
            B
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-black tracking-[-0.04em]">
              Brav<span className="text-[#8CC4EA]">HAS</span>
            </h1>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-white/48">
              Gestão Administrativa
            </p>
          </div>
        </div>
      </div>

      <nav aria-label="Navegação principal" className="flex-1 overflow-auto px-3 py-4 lg:px-4">
        {visibleSections.map((section) => (
          <div key={section.title} className="mb-5 last:mb-2">
            <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-white/38">
              {section.title}
            </p>

            <div className="space-y-1">
              {section.items.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`group flex min-h-11 items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
                      active
                        ? "bg-white text-[#0B2947] shadow-[0_12px_28px_-18px_rgba(0,0,0,0.9)]"
                        : "text-white/72 hover:bg-white/[0.07] hover:text-white"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition ${
                        active ? "bg-[#EAF3FB] text-[#154B7A]" : "bg-white/[0.06] text-white/62 group-hover:text-white"
                      }`}
                    >
                      <Icon size={16} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
          <div className="flex items-center gap-2 text-[#9ED4F5]">
            <ShieldCheck size={15} aria-hidden="true" />
            <p className="text-[10px] font-bold uppercase tracking-[0.16em]">Ambiente protegido</p>
          </div>
          <p className="mt-2 text-xs font-semibold text-white/88">Operação administrativa</p>
          <p className="mt-1 text-[11px] leading-5 text-white/45">Acesso e permissões definidos pela sua organização.</p>
        </div>
      </div>
    </div>
  );
}
