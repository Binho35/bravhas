"use client";

import { useCallback, useEffect, useState } from "react";

import type { AuthSession } from "../types/AuthSession";
import { getCurrentSession } from "../services/getCurrentSession";
import { login, type LoginInput } from "../services/login";
import { logout } from "../services/logout";

export function useAuth() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSession = useCallback(async () => {
    const result = await getCurrentSession();
    setSession(result.session);
    setLoading(false);
    return result;
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  async function signIn(input: LoginInput): Promise<boolean> {
    setError(null);
    setLoading(true);

    try {
      await login(input);
      const result = await getCurrentSession();
      setSession(result.session);
      setLoading(false);
      return result.authenticated;
    } catch (caughtError) {
      setSession(null);
      setLoading(false);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Não foi possível realizar o login.",
      );
      return false;
    }
  }

  async function signOut(): Promise<void> {
    await logout();
    setSession(null);
    setError(null);
  }

  return {
    session,
    user: session?.user ?? null,
    authenticated: Boolean(session?.authenticated),
    loading,
    error,
    signIn,
    signOut,
    refreshSession,
  };
}
