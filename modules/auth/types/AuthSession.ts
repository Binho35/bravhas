import type { AuthUser } from "./AuthUser";

export interface AuthSession {
  token: string;

  user: AuthUser;

  authenticated: boolean;

  expiresAt: string;

  createdAt: string;
}