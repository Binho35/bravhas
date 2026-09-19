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
    <div className="bravhas-header flex h-full min-w-0 items-center justify-between gap-3 px-3 sm:px-5">
      <div className="min-w-0">
        <div className="hidden items-center gap-2 sm:flex">
          <span className="bravhas-header-kicker">Centro executivo</span>
          <span className="h-1 w-1 rounded-full bg-[#C6D6E1]" />
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#73889A]">
            <ShieldCheck size={11} aria-hidden="true" />
            Sessão protegida
          </span>
        </div>
        <h1 className="mt-0.5 truncate text-[15px] font-black tracking-[-0.025em] text-[#102A43] sm:text-[17px]">
          Centro de Controle
        </h1>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <div className="bravhas-user-chip hidden sm:flex">
          <div className="min-w-0 text-right">
            <p className="truncate text-xs font-black text-[#173A54]">
              {user?.name ?? "Usuário"}
            </p>
            <p className="truncate text-[10px] font-semibold text-[#8295A5]">
              {getRoleLabel(user?.role)}
            </p>
          </div>
          <div
            className="bravhas-user-avatar"
            aria-label={`Usuário ${user?.name ?? "Usuário"}`}
            role="img"
          >
            {getInitials(user?.name ?? "Usuário")}
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={signingOut}
          className="bravhas-logout-button"
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
