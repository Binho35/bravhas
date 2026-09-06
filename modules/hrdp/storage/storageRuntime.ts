import type { StorageHealth } from "./documentStorage";
import { localDocumentStorage } from "./localDocumentStorage";

export const DOCUMENT_STORAGE_PROVIDER_ENV = "BRAVHAS_DOCUMENT_STORAGE_PROVIDER";

function isProduction() {
  return process.env.NODE_ENV === "production" || process.env.BRAVHAS_ENV === "PRODUCTION";
}

export function configuredDocumentStorageProvider() {
  const configured = process.env[DOCUMENT_STORAGE_PROVIDER_ENV]?.trim().toLowerCase();
  if (configured) return configured;
  return isProduction() ? "unconfigured" : "local";
}

export async function getDocumentStorageHealth(): Promise<StorageHealth> {
  const provider = configuredDocumentStorageProvider();

  if (provider === "local") {
    return localDocumentStorage.health();
  }

  return {
    ok: false,
    provider,
    persistent: false,
    productionSafe: false,
    code: "CONFIGURATION_INVALID",
  };
}
