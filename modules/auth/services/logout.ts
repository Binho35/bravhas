export interface LogoutResult {
  success: boolean;
}

export async function logout(): Promise<LogoutResult> {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "same-origin",
  });

  return {
    success: response.ok,
  };
}
