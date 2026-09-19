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
    <div className="bravhas-sidebar flex h-full flex-col">
      <div className="bravhas-sidebar-brand">
        <div className="bravhas-sidebar-mark">H</div>
        <div>
          <h1>
            Brav<span>HAS</span>
          </h1>
          <p>by BravSystems</p>
        </div>
      </div>

      <div className="bravhas-sidebar-context">
        <span>Head Administration System</span>
        <strong>Gestão administrativa integrada</strong>
      </div>

      <nav aria-label="Navegação principal" className="bravhas-sidebar-nav">
        {visibleSections.map((section) => (
          <div key={section.title} className="bravhas-sidebar-section">
            <p className="bravhas-sidebar-section-title">{section.title}</p>

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
                    className={`bravhas-sidebar-link ${active ? "is-active" : ""}`}
                  >
                    <span className="bravhas-sidebar-icon">
                      <Icon size={17} aria-hidden="true" />
                    </span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="bravhas-sidebar-footer">
        <div className="bravhas-security-card">
          <span className="bravhas-security-icon">
            <ShieldCheck size={16} aria-hidden="true" />
          </span>
          <div>
            <strong>Ambiente protegido</strong>
            <p>Permissões e contexto por organização.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
