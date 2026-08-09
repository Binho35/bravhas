"use client";

import type {
  ElementType,
} from "react";

import Link from "next/link";

import {
  usePathname,
} from "next/navigation";

import {
  BarChart3,
  Briefcase,
  CalendarDays,
  ClipboardList,
  FileText,
  LayoutDashboard,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import {
  usePermission,
} from "@/modules/auth/hooks/usePermission";

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
  const pathname =
    usePathname();

  const canViewDashboard =
    usePermission(
      "DASHBOARD",
      "VIEW",
    );

  const canViewObligations =
    usePermission(
      "OBLIGATIONS",
      "VIEW",
    );

  const canViewAgenda =
    usePermission(
      "AGENDA",
      "VIEW",
    );

  const canViewFinancial =
    usePermission(
      "FINANCIAL",
      "VIEW",
    );

  const canViewCashFlow =
    usePermission(
      "CASH_FLOW",
      "VIEW",
    );

  const canViewPeople =
    usePermission(
      "PEOPLE",
      "VIEW",
    );

  const canViewPayroll =
    usePermission(
      "PAYROLL",
      "VIEW",
    );

  const canViewIndicators =
    usePermission(
      "INDICATORS",
      "VIEW",
    );

  const canViewDocuments =
    usePermission(
      "DOCUMENTS",
      "VIEW",
    );

  const sections: MenuSection[] = [
    {
      title: "CENTRO",

      items: [
        {
          label:
            "Centro de Controle",

          href:
            "/",

          icon:
            LayoutDashboard,

          allowed:
            canViewDashboard,
        },
      ],
    },

    {
      title: "OPERAÇÃO",

      items: [
        {
          label:
            "Pendências",

          href:
            "/obrigacoes",

          icon:
            ClipboardList,

          allowed:
            canViewObligations,
        },

        {
          label:
            "Obrigações",

          href:
            "/obrigacoes",

          icon:
            ClipboardList,

          allowed:
            canViewObligations,
        },

        {
          label:
            "Agenda",

          href:
            "/agenda",

          icon:
            CalendarDays,

          allowed:
            canViewAgenda,
        },
      ],
    },

    {
      title: "FINANCEIRO",

      items: [
        {
          label:
            "Financeiro",

          href:
            "/financeiro",

          icon:
            Wallet,

          allowed:
            canViewFinancial,
        },

        {
          label:
            "Fluxo de Caixa",

          href:
            "/financeiro/fluxo-caixa",

          icon:
            TrendingUp,

          allowed:
            canViewCashFlow,
        },
      ],
    },

    {
      title: "PESSOAS",

      items: [
        {
          label:
            "Pessoas",

          href:
            "/pessoas",

          icon:
            Users,

          allowed:
            canViewPeople,
        },

        {
          label:
            "Departamento Pessoal",

          href:
            "/departamento-pessoal",

          icon:
            Briefcase,

          allowed:
            canViewPayroll,
        },
      ],
    },

    {
      title: "GESTÃO",

      items: [
        {
          label:
            "Indicadores",

          href:
            "/indicadores",

          icon:
            BarChart3,

          allowed:
            canViewIndicators,
        },

        {
          label:
            "Documentos",

          href:
            "/documentos",

          icon:
            FileText,

          allowed:
            canViewDocuments,
        },
      ],
    },
  ];

  const visibleSections =
    sections
      .map(
        (section) => ({
          ...section,

          items:
            section.items.filter(
              (item) =>
                item.allowed,
            ),
        }),
      )
      .filter(
        (section) =>
          section.items.length >
          0,
      );

  return (
    <div className="flex h-full flex-col bg-[#0B2947] text-white">
      <div className="border-b border-white/10 px-6 py-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Brav
          <span className="text-[#8CC4EA]">
            HAS
          </span>
        </h1>

        <p className="mt-1 text-xs text-white/45">
          Head Administration System
        </p>
      </div>

      <nav className="flex-1 overflow-auto px-3 py-4">
        {visibleSections.map(
          (section) => (
            <div
              key={
                section.title
              }
              className="mb-6"
            >
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
                {
                  section.title
                }
              </p>

              <div className="space-y-1">
                {section.items.map(
                  (item) => {
                    const active =
                      item.href === "/"
                        ? pathname ===
                          "/"
                        : pathname ===
                            item.href ||
                          pathname.startsWith(
                            `${item.href}/`,
                          );

                    const Icon =
                      item.icon;

                    return (
                      <Link
                        key={
                          item.label
                        }
                        href={
                          item.href
                        }
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                          active
                            ? "bg-[#154B7A] text-white shadow-sm"
                            : "text-white/65 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <Icon
                          size={
                            18
                          }
                        />

                        <span>
                          {
                            item.label
                          }
                        </span>
                      </Link>
                    );
                  },
                )}
              </div>
            </div>
          ),
        )}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-xl bg-white/5 p-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-white/40">
            Ambiente
          </p>

          <p className="mt-2 text-sm font-semibold">
            Administrativo
          </p>

          <p className="mt-1 text-[11px] text-white/45">
            BravHAS MVP 0.1
          </p>
        </div>
      </div>
    </div>
  );
}