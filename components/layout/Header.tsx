"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { useAuth } from "@/modules/auth/hooks/useAuth";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "US";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function getRoleLabel(role?: string): string {
  switch (role) {
    case "OWNER":
      return "Proprietário";
    case "ADMIN":
      return "Administrador";
    case "FINANCIAL":
      return "Financeiro";
    case "HR":
      return "Recursos Humanos";
    case "PAYROLL":
      return "Departamento Pessoal";
    case "OPERATIONAL":
      return "Operacional";
    default:
      return "Usuário";
  }
}

export function Header() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  async function handleLogout() {
    if (signingOut) return;
    setSigningOut(true);

    try {
      await signOut();
      router.replace("/login");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="flex h-full min-w-0 items-center justify-between gap-2 border-b border-[#E2E8F0] bg-white px-3 sm:px-5">
      <div className="min-w-0">
        <p className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-[#94A3B8] sm:block">
          BravHAS
        </p>
        <h1 className="truncate text-sm font-bold text-[#0B2947] sm:mt-0.5 sm:text-base">
          Centro de Controle
        </h1>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <div className="hidden max-w-48 text-right sm:block">
          <p className="truncate text-xs font-semibold text-[#0F172A]">{user?.name ?? "Usuário"}</p>
          <p className="truncate text-[11px] text-[#94A3B8]">{getRoleLabel(user?.role)}</p>
        </div>

        <div
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EAF3FB] text-xs font-bold text-[#154B7A]"
          aria-label={`Usuário ${user?.name ?? "Usuário"}`}
          role="img"
        >
          {getInitials(user?.name ?? "Usuário")}
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={signingOut}
          className="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-3 text-xs font-semibold text-[#475569] transition hover:border-red-200 hover:bg-red-50 hover:text-[#DC2626] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#154B7A]/30 disabled:cursor-wait disabled:opacity-60"
          aria-label={signingOut ? "Saindo do BravHAS" : "Sair do BravHAS"}
          title="Sair do BravHAS"
        >
          <LogOut size={15} aria-hidden="true" />
          <span className="hidden md:inline">{signingOut ? "Saindo..." : "Sair"}</span>
        </button>
      </div>
    </div>
  );
}
