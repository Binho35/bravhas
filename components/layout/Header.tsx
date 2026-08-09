"use client";

import {
  useRouter,
} from "next/navigation";

import {
  LogOut,
} from "lucide-react";

import {
  useAuth,
} from "@/modules/auth/hooks/useAuth";

function getInitials(
  name: string,
): string {
  const parts =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (parts.length === 0) {
    return "US";
  }

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${parts[0][0]}${
    parts[
      parts.length - 1
    ][0]
  }`.toUpperCase();
}

function getRoleLabel(
  role?: string,
): string {
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
  const router =
    useRouter();

  const {
    user,
    signOut,
  } = useAuth();

  function handleLogout() {
    signOut();

    router.replace(
      "/login",
    );
  }

  return (
    <div className="flex h-full items-center justify-between border-b border-[#E2E8F0] bg-white px-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">
          BravHAS
        </p>

        <h1 className="mt-0.5 text-base font-bold text-[#0B2947]">
          Centro de Controle
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-xs font-semibold text-[#0F172A]">
            {user?.name ??
              "Usuário"}
          </p>

          <p className="text-[11px] text-[#94A3B8]">
            {getRoleLabel(
              user?.role,
            )}
          </p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EAF3FB] text-xs font-bold text-[#154B7A]">
          {getInitials(
            user?.name ??
              "Usuário",
          )}
        </div>

        <button
          type="button"
          onClick={
            handleLogout
          }
          className="flex h-9 items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-3 text-xs font-semibold text-[#475569] transition hover:border-red-200 hover:bg-red-50 hover:text-[#DC2626]"
          title="Sair do BravHAS"
        >
          <LogOut
            size={15}
          />

          <span className="hidden md:inline">
            Sair
          </span>
        </button>
      </div>
    </div>
  );
}