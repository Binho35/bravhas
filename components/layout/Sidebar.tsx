"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  ClipboardList,
  CalendarDays,
  Wallet,
  TrendingUp,
  Users,
  Briefcase,
  BarChart3,
  FileText,
} from "lucide-react";

interface MenuItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const sections: MenuSection[] = [
  {
    title: "CENTRO",
    items: [
      {
        label: "Centro de Controle",
        href: "/",
        icon: LayoutDashboard,
      },
    ],
  },

  {
    title: "OPERAÇÃO",
    items: [
      {
        label: "Pendências",
        href: "/obrigacoes",
        icon: ClipboardList,
      },
      {
        label: "Obrigações",
        href: "/obrigacoes",
        icon: ClipboardList,
      },
      {
        label: "Agenda",
        href: "/agenda",
        icon: CalendarDays,
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
      },
      {
        label: "Fluxo de Caixa",
        href: "/financeiro/fluxo-caixa",
        icon: TrendingUp,
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
      },
      {
        label: "Departamento Pessoal",
        href: "/departamento-pessoal",
        icon: Briefcase,
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
      },
      {
        label: "Documentos",
        href: "/documentos",
        icon: FileText,
      },
    ],
  },
];

export function Sidebar() {
  const pathname =
    usePathname();

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
        {sections.map(
          (section) => (
            <div
              key={section.title}
              className="mb-6"
            >
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
                {section.title}
              </p>

              <div className="space-y-1">
                {section.items.map(
                  (item) => {
                    const active =
                      item.href === "/"
                        ? pathname ===
                          "/"
                        : pathname.startsWith(
                            item.href,
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