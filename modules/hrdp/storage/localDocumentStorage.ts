import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  StorageError,
  assertStorageScope,
  mimeTypeFromDocumentName,
  sanitizeDocumentFileName,
  validateDocumentUpload,
  type DocumentStorage,
  type DocumentStorageReadInput,
  type DocumentStorageScope,
} from "./documentStorage";

const STORAGE_PREFIX = "local:";

function storageRoot() {
  return path.join(process.cwd(), ".bravhas", "uploads");
}

function productionEnvironment() {
  return process.env.NODE_ENV === "production" || process.env.BRAVHAS_ENV === "PRODUCTION";
}

function ensureLocalStorageAllowed() {
  if (productionEnvironment()) {
    throw new StorageError(
      "CONFIGURATION_INVALID",
      "Upload local não está habilitado em produção. Configure um storage persistente antes do deploy produtivo.",
    );
  }
}

export function isLocalDocumentStorageKey(storageKey: string | null | undefined) {
  return Boolean(storageKey?.startsWith(STORAGE_PREFIX));
}

export function localDocumentOriginalName(storageKey: string) {
  const relative = storageKey.slice(STORAGE_PREFIX.length);
  const storedName = path.basename(relative);
  const separator = storedName.indexOf("-");
  return separator >= 0 ? storedName.slice(separator + 1) : storedName;
}

function expectedScopePrefix(scope: DocumentStorageScope) {
  assertStorageScope(scope);
  return `${scope.companyId}/${scope.employeeId}/`;
}

function resolveScopedLocalPath(input: DocumentStorageReadInput) {
  ensureLocalStorageAllowed();
  if (!isLocalDocumentStorageKey(input.storageKey)) {
    throw new StorageError("RESOURCE_NOT_FOUND", "Referência de arquivo local inválida.");
  }

  const relative = input.storageKey.slice(STORAGE_PREFIX.length).replaceAll("\\", "/");
  if (!relative || relative.includes("..") || path.posix.isAbsolute(relative)) {
    throw new StorageError("TENANT_ACCESS_DENIED", "Referência de arquivo local inválida.");
  }
  if (!relative.startsWith(expectedScopePrefix(input))) {
    throw new StorageError("TENANT_ACCESS_DENIED", "Arquivo fora do escopo autorizado.");
  }

  const root = path.resolve(storageRoot());
  const absolute = path.resolve(root, relative);
  const normalizedRoot = `${root}${path.sep}`;
  if (!absolute.startsWith(normalizedRoot)) {
    throw new StorageError("TENANT_ACCESS_DENIED", "Referência de arquivo fora da área autorizada.");
  }

  return { absolute, relative };
}

function asStorageError(error: unknown, message: string) {
  if (error instanceof StorageError) return error;
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code)
      : "";
  if (code === "ENOENT") return new StorageError("RESOURCE_NOT_FOUND", "Arquivo não encontrado.");
  return new StorageError("STORAGE_UNAVAILABLE", message, { cause: error });
}

export const localDocumentStorage: DocumentStorage = {
  provider: "local-filesystem",

  async save(input) {
    ensureLocalStorageAllowed();
    assertStorageScope(input);
    const validated = await validateDocumentUpload(input.file);
    const safeName = sanitizeDocumentFileName(validated.originalName);
    const relative = path.posix.join(
      input.companyId,
      input.employeeId,
      `${randomUUID()}-${safeName}`,
    );
    const root = path.resolve(storageRoot());
    const absolute = path.resolve(root, ...relative.split("/"));
    const normalizedRoot = `${root}${path.sep}`;
    if (!absolute.startsWith(normalizedRoot)) {
      throw new StorageError("TENANT_ACCESS_DENIED", "Destino de storage fora da área autorizada.");
    }

    try {
      await mkdir(path.dirname(absolute), { recursive: true });
      await writeFile(absolute, validated.bytes, { flag: "wx" });
    } catch (error) {
      throw asStorageError(error, "Não foi possível persistir o documento.");
    }

    return {
      storageKey: `${STORAGE_PREFIX}${relative}`,
      originalName: safeName,
      mimeType: validated.mimeType,
      size: validated.bytes.byteLength,
      checksumSha256: validated.checksumSha256,
    };
  },

  async read(input) {
    const { absolute } = resolveScopedLocalPath(input);
    const originalName = localDocumentOriginalName(input.storageKey);
    const mimeType = mimeTypeFromDocumentName(originalName);
    if (!mimeType) {
      throw new StorageError("VALIDATION_FAILED", "Tipo de arquivo armazenado não reconhecido.");
    }

    try {
      const buffer = await readFile(absolute);
      const bytes = new Uint8Array(buffer);
      return {
        storageKey: input.storageKey,
        originalName,
        mimeType,
        size: bytes.byteLength,
        checksumSha256: createHash("sha256").update(bytes).digest("hex"),
        bytes,
      };
    } catch (error) {
      throw asStorageError(error, "Não foi possível ler o documento.");
    }
  },

  async delete(input) {
    const { absolute } = resolveScopedLocalPath(input);
    try {
      await unlink(absolute);
    } catch (error) {
      throw asStorageError(error, "Não foi possível excluir o documento.");
    }
  },

  async health() {
    return {
      ok: !productionEnvironment(),
      provider: "local-filesystem",
      persistent: false,
      productionSafe: false,
      ...(!productionEnvironment() ? {} : { code: "CONFIGURATION_INVALID" as const }),
    };
  },
};

export async function saveLocalDocumentFile(input: DocumentStorageScope & { file: File }) {
  return (await localDocumentStorage.save(input)).storageKey;
}
