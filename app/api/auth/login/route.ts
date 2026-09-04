import { randomBytes } from "node:crypto";

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { logServerFailure, safeErrorMessage } from "@/lib/serverErrors";
import { AuthenticateUserUseCase } from "@/modules/auth/application/use-cases/AuthenticateUserUseCase";
import {
  hashSessionToken,
  SESSION_TTL_MS,
  setSessionCookie,
} from "@/modules/auth/server/session";

const SAFE_AUTH_ERRORS = ["Login ou senha inválidos."] as const;

export async function POST(
  request: Request,
) {
  try {
    const body = await request.json();

    const loginId =
      typeof body.loginId === "string"
        ? body.loginId
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    const useCase =
      new AuthenticateUserUseCase();

    const result =
      await useCase.execute({
        loginId,
        password,
      });

    const token = randomBytes(32).toString("hex");
    const tokenHash = hashSessionToken(token);
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    await prisma.userSession.create({
      data: {
        userId: result.user.id,
        tokenHash,
        expiresAt,
        lastSeenAt: new Date(),
      },
    });

    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: result.user,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    logServerFailure("Erro na autenticação", error);

    return NextResponse.json(
      {
        success: false,
        message: safeErrorMessage(error, SAFE_AUTH_ERRORS, "Não foi possível realizar o login."),
      },
      {
        status: 401,
      },
    );
  }
}
