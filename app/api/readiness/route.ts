import { NextResponse } from "next/server";

import { logOperationalEvent, resolveRequestId } from "@/lib/observability";
import { prisma } from "@/lib/prisma";
import { logServerFailure } from "@/lib/serverErrors";
import type { StorageHealth } from "@/modules/hrdp/storage/documentStorage";
import { getDocumentStorageHealth } from "@/modules/hrdp/storage/storageRuntime";

export function classifyBravhasRuntimeEnvironment(
  bravhasEnv: string | undefined = process.env.BRAVHAS_ENV,
  nodeEnv: string | undefined = process.env.NODE_ENV,
) {
  // NODE_ENV identifies the optimized Next.js execution mode, not the BravHAS
  // commercial deployment target. Preview builds also run with NODE_ENV=production.
  void nodeEnv;
  const normalized = bravhasEnv?.trim().toUpperCase();
  if (normalized === "PRODUCTION") return { production: true, label: "production" as const };
  if (normalized === "HOMOLOGATION") return { production: false, label: "homologation" as const };
  if (normalized === "TEST") return { production: false, label: "test" as const };
  return { production: false, label: "non-production" as const };
}

export function evaluateReadiness(
  databaseReady: boolean,
  storage: StorageHealth,
  bravhasEnv: string | undefined = process.env.BRAVHAS_ENV,
  nodeEnv: string | undefined = process.env.NODE_ENV,
) {
  const environment = classifyBravhasRuntimeEnvironment(bravhasEnv, nodeEnv);
  const storageReady = storage.ok && (!environment.production || (storage.persistent && storage.productionSafe));
  const ready = databaseReady && storageReady;
  return {
    ...environment,
    storageReady,
    ready,
    statusCode: ready ? 200 : 503,
  };
}

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

  const decision = evaluateReadiness(databaseReady, storage);
  const durationMs = Date.now() - startedAt;

  logOperationalEvent({
    level: decision.ready ? "info" : "warn",
    operation: "readiness",
    requestId,
    status: decision.ready ? "ready" : "blocked",
    durationMs,
    errorCode: decision.ready ? undefined : !databaseReady ? "DATABASE_UNAVAILABLE" : storage.code ?? "STORAGE_UNAVAILABLE",
  });

  const response = NextResponse.json(
    {
      status: decision.ready ? "ready" : "blocked",
      application: "bravhas",
      environment: decision.label,
      dependencies: {
        database: databaseReady ? "ready" : "unavailable",
        storage: {
          status: decision.storageReady ? "ready" : "blocked",
          provider: storage.provider,
          persistent: storage.persistent,
          productionSafe: storage.productionSafe,
          code: decision.storageReady ? undefined : storage.code,
        },
      },
      responseTimeMs: durationMs,
      timestamp: new Date().toISOString(),
    },
    { status: decision.statusCode },
  );
  response.headers.set("X-Request-ID", requestId);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
