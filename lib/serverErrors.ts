export function safeErrorMessage(
  error: unknown,
  allowedMessages: readonly string[],
  fallback: string,
) {
  if (!(error instanceof Error)) return fallback;
  return allowedMessages.includes(error.message) ? error.message : fallback;
}

export function logServerFailure(context: string, error: unknown) {
  const name = error instanceof Error ? error.name : "UnknownError";
  console.error(context, { errorType: name });
}
