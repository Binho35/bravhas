import { NextResponse } from "next/server";

import { logOperationalEvent, resolveRequestId } from "@/lib/observability";
import { prisma } from "@/lib/prisma";
import { logServerFailure } from "@/lib/serverErrors";
import type { StorageHealth } from "@/modules/hrdp/storage/documentStorage";
import { getDocumentStorageHealth } from "@/modules/hrdp/storage/storageRuntime";

export async function GET(request: Request) {
  const startedAt = Date.now();
  const requestId = resolveRequestId(request);
  let databaseReady = false;

  try {
    await prisma.$queryRaw`SELECT 1`;
    databaseReady = true;
  } catch (error) {
    logServerFailure("Readiness database check failed", error);
  }

  let storage: StorageHealth = {
    ok: false,
    provider: "unknown",
    persistent: false,
    productionSafe: false,
    code: "STORAGE_UNAVAILABLE",
  };

  try {
    storage = await getDocumentStorageHealth();
  } catch (error) {
    logServerFailure("Readiness storage check failed", error);
  }

  const production = process.env.NODE_ENV === "production" || process.env.BRAVHAS_ENV === "PRODUCTION";
  const storageReady = storage.ok && (!production || (storage.persistent && storage.productionSafe));
  const ready = databaseReady && storageReady;
  const durationMs = Date.now() - startedAt;

  logOperationalEvent({
    level: ready ? "info" : "warn",
    operation: "readiness",
    requestId,
    status: ready ? "ready" : "blocked",
    durationMs,
    errorCode: ready ? undefined : !databaseReady ? "DATABASE_UNAVAILABLE" : storage.code ?? "STORAGE_UNAVAILABLE",
  });

  const response = NextResponse.json(
    {
      status: ready ? "ready" : "blocked",
      application: "bravhas",
      environment: production ? "production" : "non-production",
      dependencies: {
        database: databaseReady ? "ready" : "unavailable",
        storage: {
          status: storageReady ? "ready" : "blocked",
          provider: storage.provider,
          persistent: storage.persistent,
          productionSafe: storage.productionSafe,
          code: storageReady ? undefined : storage.code,
        },
      },
      responseTimeMs: durationMs,
      timestamp: new Date().toISOString(),
    },
    { status: ready ? 200 : 503 },
  );
  response.headers.set("X-Request-ID", requestId);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
