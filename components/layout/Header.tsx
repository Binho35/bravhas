"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck } from "lucide-react";

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
    <div className="flex h-full min-w-0 items-center justify-between gap-3 px-3 sm:px-5 lg:px-7">
      <div className="min-w-0">
        <p className="hidden text-[10px] font-bold uppercase tracking-[0.19em] text-[#7890A5] sm:block">
          BRAVHAS • GESTÃO ADMINISTRATIVA
        </p>
        <h1 className="truncate text-sm font-bold tracking-[-0.015em] text-[#0B2947] sm:mt-0.5 sm:text-base">
          Centro de Controle
        </h1>
      </div>

      <div className="flex shrink-0 items-center gap-2.5">
        <div className="hidden items-center gap-3 rounded-2xl border border-[#E2EAF1] bg-[#F8FAFC] px-3 py-2 sm:flex">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF3FB] text-xs font-black text-[#154B7A]">
            {getInitials(user?.name ?? "Usuário")}
          </span>
          <div className="min-w-0 max-w-44">
            <p className="truncate text-xs font-bold text-[#102A43]">{user?.name ?? "Usuário"}</p>
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-[10px] font-medium text-[#7890A5]">
              <ShieldCheck size={11} aria-hidden="true" />
              {getRoleLabel(user?.role)}
            </p>
          </div>
        </div>

        <div
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EAF3FB] text-xs font-black text-[#154B7A] sm:hidden"
          aria-label={`Usuário ${user?.name ?? "Usuário"}`}
          role="img"
        >
          {getInitials(user?.name ?? "Usuário")}
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={signingOut}
          className="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-2xl border border-[#DCE6F0] bg-white px-3 text-xs font-bold text-[#536A7F] transition hover:border-red-200 hover:bg-red-50 hover:text-[#C2413B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2C7DB6]/15 disabled:cursor-wait disabled:opacity-60"
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
