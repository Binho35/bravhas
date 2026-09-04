import type { AuthSession } from "../types/AuthSession";

export interface GetCurrentSessionResult {
  session: AuthSession | null;
  authenticated: boolean;
}

type SessionApiResponse =
  | { authenticated: true; session: AuthSession }
  | { authenticated: false; session: null };

export async function getCurrentSession(): Promise<GetCurrentSessionResult> {
  try {
    const response = await fetch("/api/auth/session", {
      method: "GET",
      cache: "no-store",
      credentials: "same-origin",
    });

    if (!response.ok) {
      return { session: null, authenticated: false };
    }

    const data = (await response.json()) as SessionApiResponse;
    if (!data.authenticated || !data.session?.user?.active) {
      return { session: null, authenticated: false };
    }

    return { session: data.session, authenticated: true };
  } catch {
    return { session: null, authenticated: false };
  }
}
