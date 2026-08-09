import type {
  AuthSession,
} from "../types/AuthSession";

import {
  findAuthUserByLoginId,
  saveAuthSession,
} from "../storage/authStorage";

export interface LoginInput {
  loginId: string;

  password: string;
}

export interface LoginResult {
  session: AuthSession;
}

const DEVELOPMENT_PASSWORD =
  "BravHAS@123";

function createSessionToken(): string {
  return `AUTH-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export function login({
  loginId,
  password,
}: LoginInput): LoginResult {
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

  const user =
    findAuthUserByLoginId(
      normalizedLoginId,
    );

  if (!user) {
    throw new Error(
      "Usuário não encontrado.",
    );
  }

  if (!user.active) {
    throw new Error(
      "Este usuário está inativo.",
    );
  }

  if (
    password !==
    DEVELOPMENT_PASSWORD
  ) {
    throw new Error(
      "Login ou senha inválidos.",
    );
  }

  const now =
    new Date();

  const expiresAt =
    new Date(
      now.getTime() +
        8 *
          60 *
          60 *
          1000,
    );

  const session: AuthSession = {
    token:
      createSessionToken(),

    user,

    authenticated:
      true,

    createdAt:
      now.toISOString(),

    expiresAt:
      expiresAt.toISOString(),
  };

  saveAuthSession(
    session,
  );

  return {
    session,
  };
}