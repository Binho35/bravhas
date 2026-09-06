import { createHash, randomUUID } from "node:crypto";

export type OperationalLogLevel = "info" | "warn" | "error";

export type OperationalEvent = {
  level: OperationalLogLevel;
  operation: string;
  requestId?: string;
  status?: string;
  durationMs?: number;
  errorCode?: string;
  tenantId?: string | null;
  userId?: string | null;
};

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{8,128}$/;

function anonymizedRef(value: string | null | undefined) {
  if (!value) return undefined;
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

export function resolveRequestId(request: Request) {
  const inbound = request.headers.get("x-request-id")?.trim();
  return inbound && REQUEST_ID_PATTERN.test(inbound) ? inbound : randomUUID();
}

export function logOperationalEvent(event: OperationalEvent) {
  const record = {
    timestamp: new Date().toISOString(),
    application: "bravhas",
    operation: event.operation,
    requestId: event.requestId,
    status: event.status,
    durationMs: event.durationMs,
    errorCode: event.errorCode,
    tenantRef: anonymizedRef(event.tenantId),
    userRef: anonymizedRef(event.userId),
  };

  const serialized = JSON.stringify(record);
  if (event.level === "error") console.error(serialized);
  else if (event.level === "warn") console.warn(serialized);
  else console.info(serialized);
}
