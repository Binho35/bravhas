import { createHash } from "node:crypto";

import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import type { AuthUserRole } from "../types/AuthUser";

export const SESSION_COOKIE_NAME = "bravhas_session";
const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

export const HRDP_ALLOWED_ROLES: AuthUserRole[] = ["OWNER", "ADMIN", "HR", "PAYROLL"];

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function getServerAuthSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  const tokenHash = hashSessionToken(token);
  const session = await prisma.userSession.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session || session.revokedAt || session.expiresAt <= new Date() || !session.user.active) {
    return null;
  }

  await prisma.userSession.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date() },
  });

  return session;
}

export async function getServerAuthUser() {
  const session = await getServerAuthSession();
  return session?.user ?? null;
}

export async function requireServerRole(allowedRoles: AuthUserRole[]) {
  const developmentBypassEnabled =
    process.env.NODE_ENV === "development" && process.env.BRAVHAS_DEV_AUTH_BYPASS === "true";

  if (developmentBypassEnabled) {
    return null;
  }

  const user = await getServerAuthUser();
  if (!user) throw new Error("Sessão inválida ou expirada.");

  if (!allowedRoles.includes(user.role as AuthUserRole)) {
    throw new Error("Usuário sem permissão para esta operação.");
  }

  return user;
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export const SESSION_TTL_MS = SESSION_MAX_AGE_SECONDS * 1000;
