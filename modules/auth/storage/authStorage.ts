import type {
  AuthSession,
} from "../types/AuthSession";

import type {
  AuthUser,
} from "../types/AuthUser";

const SESSION_STORAGE_KEY =
  "bravhas_auth_session";

const USERS_STORAGE_KEY =
  "bravhas_auth_users";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function normalizeLoginId(
  value: string,
): string {
  return value
    .trim()
    .toLowerCase();
}

function normalizeEmail(
  value: string,
): string {
  return value
    .trim()
    .toLowerCase();
}

export function getStoredAuthSession(): AuthSession | null {
  if (!isBrowser()) {
    return null;
  }

  const storedValue =
    window.localStorage.getItem(
      SESSION_STORAGE_KEY,
    );

  if (!storedValue) {
    return null;
  }

  try {
    const parsed =
      JSON.parse(
        storedValue,
      ) as AuthSession;

    if (
      !parsed ||
      typeof parsed !== "object"
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function saveAuthSession(
  session: AuthSession,
): void {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify(session),
  );
}

export function clearAuthSession(): void {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(
    SESSION_STORAGE_KEY,
  );
}

export function getStoredAuthUsers(): AuthUser[] {
  if (!isBrowser()) {
    return [];
  }

  const storedValue =
    window.localStorage.getItem(
      USERS_STORAGE_KEY,
    );

  if (!storedValue) {
    return [];
  }

  try {
    const parsed =
      JSON.parse(
        storedValue,
      ) as AuthUser[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch {
    return [];
  }
}

export function saveAuthUsers(
  users: AuthUser[],
): void {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(
    USERS_STORAGE_KEY,
    JSON.stringify(users),
  );
}

export function addAuthUser(
  user: AuthUser,
): void {
  const users =
    getStoredAuthUsers();

  const existingById =
    users.some(
      (item) =>
        item.id === user.id,
    );

  if (existingById) {
    throw new Error(
      "Já existe um usuário com este identificador.",
    );
  }

  const existingByLoginId =
    users.some(
      (item) =>
        normalizeLoginId(
          item.loginId,
        ) ===
        normalizeLoginId(
          user.loginId,
        ),
    );

  if (existingByLoginId) {
    throw new Error(
      "Este login já está em uso.",
    );
  }

  saveAuthUsers([
    ...users,
    user,
  ]);
}

export function updateAuthUser(
  user: AuthUser,
): void {
  const users =
    getStoredAuthUsers();

  const duplicatedLogin =
    users.some(
      (item) =>
        item.id !== user.id &&
        normalizeLoginId(
          item.loginId,
        ) ===
          normalizeLoginId(
            user.loginId,
          ),
    );

  if (duplicatedLogin) {
    throw new Error(
      "Este login já está em uso.",
    );
  }

  const updated =
    users.map(
      (item) =>
        item.id === user.id
          ? user
          : item,
    );

  saveAuthUsers(
    updated,
  );
}

export function removeAuthUser(
  userId: string,
): void {
  const users =
    getStoredAuthUsers();

  const updated =
    users.filter(
      (item) =>
        item.id !== userId,
    );

  saveAuthUsers(
    updated,
  );
}

export function findAuthUserByLoginId(
  loginId: string,
): AuthUser | null {
  const normalizedLoginId =
    normalizeLoginId(
      loginId,
    );

  return (
    getStoredAuthUsers().find(
      (user) =>
        normalizeLoginId(
          user.loginId,
        ) ===
        normalizedLoginId,
    ) ?? null
  );
}

export function findAuthUserByEmail(
  email: string,
): AuthUser | null {
  const normalizedEmail =
    normalizeEmail(
      email,
    );

  return (
    getStoredAuthUsers().find(
      (user) =>
        normalizeEmail(
          user.email,
        ) ===
        normalizedEmail,
    ) ?? null
  );
}

export function clearAuthUsers(): void {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(
    USERS_STORAGE_KEY,
  );
}