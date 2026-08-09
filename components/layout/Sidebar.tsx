"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  {
    label: "Centro de Controle",
    href: "/",
  },
  {
    label: "Pendências",
    href: "/obrigacoes",
  },
  {
    label: "Obrigações",
    href: "/obrigacoes",
  },
  {
    label: "Agenda",
    href: "/agenda",
  },
  {
    label: "Financeiro",
    href: "/financeiro",
  },
  {
    label: "Pessoas",
    href: "/pessoas",
  },
  {
    label: "Departamento Pessoal",
    href: "/departamento-pessoal",
  },
  {
    label: "Indicadores",
    href: "/indicadores",
  },
  {
    label: "Documentos",
    href: "/documentos",
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col text-white">
      <div className="border-b border-white/10 px-5 py-5">
        <div className="text-xl font-bold tracking-tight">
          Brav
          <span className="text-[#8CC4EA]">
            HAS
          </span>
        </div>

        <p className="mt-1 text-[11px] text-white/50">
          Head Administration System
        </p>
      </div>

      <nav className="flex-1 space-y-1 overflow-hidden px-3 py-4">
        {menuItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(
                  item.href,
                );

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm transition ${
                isActive
                  ? "bg-white/10 font-semibold text-white"
                  : "text-white/65 hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="rounded-xl bg-white/5 p-3">
          <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">
            Ambiente
          </p>

          <p className="mt-1 text-sm font-semibold">
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