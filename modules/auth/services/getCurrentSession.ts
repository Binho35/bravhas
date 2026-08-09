import type {
  AuthSession,
} from "../types/AuthSession";

import {
  clearAuthSession,
  getStoredAuthSession,
} from "../storage/authStorage";

export interface GetCurrentSessionResult {
  session: AuthSession | null;

  authenticated: boolean;
}

export function getCurrentSession(): GetCurrentSessionResult {
  const session =
    getStoredAuthSession();

  if (!session) {
    return {
      session: null,
      authenticated: false,
    };
  }

  if (!session.authenticated) {
    clearAuthSession();

    return {
      session: null,
      authenticated: false,
    };
  }

  const expiresAt =
    new Date(
      session.expiresAt,
    ).getTime();

  if (
    !Number.isFinite(
      expiresAt,
    ) ||
    expiresAt <= Date.now()
  ) {
    clearAuthSession();

    return {
      session: null,
      authenticated: false,
    };
  }

  if (!session.user.active) {
    clearAuthSession();

    return {
      session: null,
      authenticated: false,
    };
  }

  return {
    session,
    authenticated: true,
  };
}