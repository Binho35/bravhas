export function safeErrorMessage(
  error: unknown,
  allowedMessages: readonly string[],
  fallback: string,
) {
  if (!(error instanceof Error)) return fallback;
  return allowedMessages.includes(error.message) ? error.message : fallback;
}

function sanitizeDiagnosticText(value: string) {
  return value
    .replace(/postgres(?:ql)?:\/\/[^\s]+/gi, "[DATABASE_URL_REDACTED]")
    .replace(/(password|token|cookie|secret|authorization)\s*[:=]\s*[^\s,;}]+/gi, "$1=[REDACTED]")
    .slice(0, 1200);
}

function errorCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && typeof (error as { code?: unknown }).code === "string"
    ? (error as { code: string }).code
    : undefined;
}

export function logServerFailure(context: string, error: unknown) {
  const name = error instanceof Error ? error.name : "UnknownError";
  const code = errorCode(error);
  const diagnostic: Record<string, string> = { errorType: name };
  if (code) diagnostic.errorCode = code;

  if (process.env.NODE_ENV !== "production" && error instanceof Error) {
    diagnostic.message = sanitizeDiagnosticText(error.message);
    if (error.stack) diagnostic.stack = sanitizeDiagnosticText(error.stack);
  }

  console.error(context, diagnostic);
}

export function serverErrorStatus(error: unknown) {
  const code = errorCode(error);
  if (code === "VALIDATION_FAILED") return 400;
  if (code === "TENANT_ACCESS_DENIED") return 404;
  if (code === "RESOURCE_NOT_FOUND") return 404;
  if (code === "P2034") return 409;
  if (code === "STORAGE_UNAVAILABLE" || code === "CONFIGURATION_INVALID") return 503;

  if (!(error instanceof Error)) return 500;
  if (
    error.message === "Sessão inválida ou expirada." ||
    error.message === "Autenticação financeira indisponível." ||
    error.message === "Autenticação de obrigações indisponível."
  ) {
    return 401;
  }
  if (error.message === "Usuário sem permissão para esta operação.") return 403;
  return 500;
}
