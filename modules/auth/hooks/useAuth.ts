"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import type {
  AuthSession,
} from "../types/AuthSession";

import {
  getCurrentSession,
} from "../services/getCurrentSession";

import {
  login,
  type LoginInput,
} from "../services/login";

import {
  logout,
} from "../services/logout";

export function useAuth() {
  const [
    session,
    setSession,
  ] =
    useState<AuthSession | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  const refreshSession =
    useCallback(() => {
      const result =
        getCurrentSession();

      setSession(
        result.session,
      );

      setLoading(false);

      return result;
    }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  function signIn(
    input: LoginInput,
  ): boolean {
    setError(null);

    try {
      const result =
        login(input);

      setSession(
        result.session,
      );

      return true;
    } catch (caughtError) {
      setSession(null);

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Não foi possível realizar o login.",
      );

      return false;
    }
  }

  function signOut(): void {
    logout();

    setSession(null);

    setError(null);
  }

  return {
    session,

    user:
      session?.user ?? null,

    authenticated:
      Boolean(
        session?.authenticated,
      ),

    loading,

    error,

    signIn,

    signOut,

    refreshSession,
  };
}