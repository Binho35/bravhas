import { StorageError, type DocumentStorage, type StorageHealth } from "./documentStorage";
import { isLocalDocumentStorageKey, localDocumentStorage } from "./localDocumentStorage";
import {
  isVercelBlobDocumentStorageKey,
  vercelBlobDocumentStorage,
} from "./vercelBlobDocumentStorage";

export const DOCUMENT_STORAGE_PROVIDER_ENV = "BRAVHAS_DOCUMENT_STORAGE_PROVIDER";

function isProduction() {
  return process.env.NODE_ENV === "production" || process.env.BRAVHAS_ENV === "PRODUCTION";
}

export function configuredDocumentStorageProvider() {
  const configured = process.env[DOCUMENT_STORAGE_PROVIDER_ENV]?.trim().toLowerCase();
  if (configured) return configured;
  return isProduction() ? "unconfigured" : "local";
}

export function getDocumentStorage(): DocumentStorage {
  const provider = configuredDocumentStorageProvider();
  if (provider === "local") return localDocumentStorage;
  if (provider === "vercel-blob") return vercelBlobDocumentStorage;
  throw new StorageError("CONFIGURATION_INVALID", `Provider documental não suportado: ${provider}.`);
}

export function documentStorageForKey(storageKey: string | null | undefined): DocumentStorage | null {
  if (isLocalDocumentStorageKey(storageKey)) return localDocumentStorage;
  if (isVercelBlobDocumentStorageKey(storageKey)) return vercelBlobDocumentStorage;
  return null;
}

export function isManagedDocumentStorageKey(storageKey: string | null | undefined) {
  return Boolean(documentStorageForKey(storageKey));
}

export async function getDocumentStorageHealth(): Promise<StorageHealth> {
  const provider = configuredDocumentStorageProvider();
  try {
    return await getDocumentStorage().health();
  } catch (error) {
    return {
      ok: false,
      provider,
      persistent: false,
      productionSafe: false,
      code: error instanceof StorageError ? error.code : "CONFIGURATION_INVALID",
    };
  }
}
