import type { StorageHealth } from "@/modules/hrdp/storage/documentStorage";

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
