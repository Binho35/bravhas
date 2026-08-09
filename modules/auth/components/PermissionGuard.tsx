"use client";

import type {
  ReactNode,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  useEffect,
} from "react";

import type {
  PermissionAction,
  PermissionResource,
} from "../domain/Permission";

import {
  useAuth,
} from "../hooks/useAuth";

import {
  hasPermission,
} from "../services/hasPermission";

interface PermissionGuardProps {
  children: ReactNode;

  resource: PermissionResource;

  action?: PermissionAction;

  redirectTo?: string;
}

export function PermissionGuard({
  children,
  resource,
  action = "VIEW",
  redirectTo = "/",
}: PermissionGuardProps) {
  const router =
    useRouter();

  const {
    user,
    loading,
  } = useAuth();

  const allowed =
    hasPermission({
      user,
      resource,
      action,
    });

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!allowed) {
      router.replace(
        redirectTo,
      );
    }
  }, [
    allowed,
    loading,
    redirectTo,
    router,
  ]);

  if (loading) {
    return (
      <main className="flex min-h-full items-center justify-center bg-[#F7F9FC]">
        <div className="rounded-2xl border border-[#E2E8F0] bg-white px-8 py-7 text-center shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">
            BravHAS
          </p>

          <h2 className="mt-2 text-lg font-bold text-[#0B2947]">
            Validando permissão...
          </h2>

          <p className="mt-2 text-sm text-[#64748B]">
            Verificando acesso ao módulo.
          </p>
        </div>
      </main>
    );
  }

  if (!allowed) {
    return null;
  }

  return children;
}