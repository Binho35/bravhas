import type {
  AuthSession,
} from "../types/AuthSession";

import type {
  AuthUser,
} from "../types/AuthUser";

import {
  saveAuthSession,
} from "../storage/authStorage";

export interface LoginInput {
  loginId: string;

  password: string;
}

export interface LoginResult {
  session: AuthSession;
}

interface LoginApiSuccess {
  success: true;

  user: AuthUser;

  expiresAt: string;
}

interface LoginApiFailure {
  success: false;

  message: string;
}

type LoginApiResponse =
  | LoginApiSuccess
  | LoginApiFailure;

export async function login({
  loginId,
  password,
}: LoginInput): Promise<LoginResult> {
  const normalizedLoginId =
    loginId
      .trim()
      .toLowerCase();

  if (!normalizedLoginId) {
    throw new Error(
      "Informe o login.",
    );
  }

  if (!password.trim()) {
    throw new Error(
      "Informe a senha.",
    );
  }

  const response =
    await fetch(
      "/api/auth/login",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          loginId:
            normalizedLoginId,

          password,
        }),
      },
    );

  let data:
    | LoginApiResponse
    | null = null;

  try {
    data =
      (await response.json()) as LoginApiResponse;
  } catch {
    throw new Error(
      "Não foi possível processar a resposta de autenticação.",
    );
  }

  if (
    !response.ok ||
    !data ||
    !data.success
  ) {
    throw new Error(
      data &&
      !data.success
        ? data.message
        : "Login ou senha inválidos.",
    );
  }

  const now = new Date();

  const session: AuthSession = {
    token: "SERVER_COOKIE",
    user: data.user,
    authenticated: true,
    createdAt: now.toISOString(),
    expiresAt: data.expiresAt,
  };

  saveAuthSession(session);

  return {
    session,
  };
}