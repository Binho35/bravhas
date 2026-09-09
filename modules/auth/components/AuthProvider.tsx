"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import type { AuthSession } from "../types/AuthSession";
import { getCurrentSession } from "../services/getCurrentSession";
import { login, type LoginInput } from "../services/login";
import { logout } from "../services/logout";

interface AuthContextValue {
  session: AuthSession | null;
  user: AuthSession["user"] | null;
  authenticated: boolean;
  loading: boolean;
  error: string | null;
  signIn(input: LoginInput): Promise<boolean>;
  signOut(): Promise<void>;
  refreshSession(): Promise<{ authenticated: boolean; session: AuthSession | null }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
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

  const signIn = useCallback(async (input: LoginInput): Promise<boolean> => {
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
      setError(caughtError instanceof Error ? caughtError.message : "Não foi possível realizar o login.");
      return false;
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    await logout();
    setSession(null);
    setError(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user: session?.user ?? null,
    authenticated: Boolean(session?.authenticated),
    loading,
    error,
    signIn,
    signOut,
    refreshSession,
  }), [session, loading, error, signIn, signOut, refreshSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useSharedAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser utilizado dentro de AuthProvider.");
  }
  return context;
}
