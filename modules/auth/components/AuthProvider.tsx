"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

import { getCurrentSession, type GetCurrentSessionResult } from "../services/getCurrentSession";
import { login, type LoginInput } from "../services/login";
import { logout } from "../services/logout";
import type { AuthSession } from "../types/AuthSession";

export interface AuthContextValue {
  session: AuthSession | null;
  user: AuthSession["user"] | null;
  authenticated: boolean;
  loading: boolean;
  error: string | null;
  signIn: (input: LoginInput) => Promise<boolean>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<GetCurrentSessionResult>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refreshSequence = useRef(0);
  const validatedPath = useRef<string | null>(null);

  const refreshSession = useCallback(async () => {
    const sequence = refreshSequence.current + 1;
    refreshSequence.current = sequence;
    setLoading(true);

    const result = await getCurrentSession();

    if (refreshSequence.current === sequence) {
      setSession(result.session);
      setLoading(false);
    }

    return result;
  }, []);

  useEffect(() => {
    if (validatedPath.current === pathname) return;
    validatedPath.current = pathname;
    void refreshSession();
  }, [pathname, refreshSession]);

  const signIn = useCallback(async (input: LoginInput): Promise<boolean> => {
    setError(null);
    setLoading(true);

    try {
      await login(input);
      const result = await refreshSession();
      return result.authenticated;
    } catch (caughtError) {
      refreshSequence.current += 1;
      setSession(null);
      setLoading(false);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Não foi possível realizar o login.",
      );
      return false;
    }
  }, [refreshSession]);

  const signOut = useCallback(async (): Promise<void> => {
    refreshSequence.current += 1;
    await logout();
    setSession(null);
    setError(null);
    setLoading(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      authenticated: Boolean(session?.authenticated),
      loading,
      error,
      signIn,
      signOut,
      refreshSession,
    }),
    [error, loading, refreshSession, session, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
