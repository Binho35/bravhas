import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { logServerFailure } from "@/lib/serverErrors";
import { getDocumentStorageHealth } from "@/modules/hrdp/storage/storageRuntime";

export async function GET() {
  const startedAt = Date.now();
  let databaseReady = false;

  try {
    await prisma.$queryRaw`SELECT 1`;
    databaseReady = true;
  } catch (error) {
    logServerFailure("Readiness database check failed", error);
  }

  let storage = {
    ok: false,
    provider: "unknown",
    persistent: false,
    productionSafe: false,
    code: "STORAGE_UNAVAILABLE" as const,
  };

  try {
    storage = await getDocumentStorageHealth();
  } catch (error) {
    logServerFailure("Readiness storage check failed", error);
  }

  const production = process.env.NODE_ENV === "production" || process.env.BRAVHAS_ENV === "PRODUCTION";
  const storageReady = storage.ok && (!production || (storage.persistent && storage.productionSafe));
  const ready = databaseReady && storageReady;

  return NextResponse.json(
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
      responseTimeMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    },
    { status: ready ? 200 : 503 },
  );
}
