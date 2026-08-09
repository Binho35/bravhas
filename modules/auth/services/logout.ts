import {
  clearAuthSession,
} from "../storage/authStorage";

export interface LogoutResult {
  success: boolean;
}

export function logout(): LogoutResult {
  clearAuthSession();

  return {
    success: true,
  };
}