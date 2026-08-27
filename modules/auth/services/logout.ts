import {
  clearAuthSession,
} from "../storage/authStorage";

export interface LogoutResult {
  success: boolean;
}

export async function logout(): Promise<LogoutResult> {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } finally {
    clearAuthSession();
  }

  return {
    success: true,
  };
}