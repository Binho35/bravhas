import { createHash, randomUUID } from "node:crypto";

import { del, get, head, put } from "@vercel/blob";

import {
  StorageError,
  assertStorageScope,
  mimeTypeFromDocumentName,
  sanitizeDocumentFileName,
  validateDocumentUpload,
  type DocumentStorage,
  type DocumentStorageReadInput,
  type DocumentStorageScope,
  type DocumentStorageMimeType,
} from "./documentStorage";

const STORAGE_PREFIX = "vercel-blob:";
const HEALTHCHECK_PATH = "__bravhas/healthcheck-not-created";
const FILE_SEPARATOR = "--";

export type VercelBlobReadResult = {
  statusCode: number;
  stream: ReadableStream<Uint8Array> | null;
  blob: {
    pathname: string;
    contentType?: string;
    size?: number;
  };
};

export type VercelBlobOperations = {
  putPrivate(pathname: string, bytes: Uint8Array, contentType: DocumentStorageMimeType): Promise<{ pathname: string }>;
  getPrivate(pathname: string): Promise<VercelBlobReadResult | null>;
  delete(pathname: string): Promise<void>;
  probe(pathname: string): Promise<void>;
};

function asArrayBuffer(bytes: Uint8Array) {
  const copy = Uint8Array.from(bytes);
  return copy.buffer;
}

const sdkOperations: VercelBlobOperations = {
  async putPrivate(pathname, bytes, contentType) {
    const result = await put(pathname, asArrayBuffer(bytes), {
      access: "private",
      contentType,
      addRandomSuffix: false,
    });
    return { pathname: result.pathname };
  },

  async getPrivate(pathname) {
    const result = await get(pathname, { access: "private", useCache: false });
    if (!result) return null;
    return {
      statusCode: result.statusCode,
      stream: result.stream as ReadableStream<Uint8Array> | null,
      blob: {
        pathname: result.blob.pathname,
        contentType: result.blob.contentType ?? undefined,
        size: result.blob.size ?? undefined,
      },
    };
  },

  async delete(pathname) {
    await del(pathname);
  },

  async probe(pathname) {
    await head(pathname);
  },
};

function errorName(error: unknown) {
  return typeof error === "object" && error !== null && "name" in error
    ? String((error as { name?: unknown }).name)
    : "";
}

function configurationFailure(error: unknown) {
  const name = errorName(error).toLowerCase();
  return name.includes("access") || name.includes("token") || name.includes("store");
}

function asStorageError(error: unknown, message: string) {
  if (error instanceof StorageError) return error;
  if (errorName(error) === "BlobNotFoundError") {
    return new StorageError("RESOURCE_NOT_FOUND", "Arquivo não encontrado.");
  }
  if (configurationFailure(error)) {
    return new StorageError("CONFIGURATION_INVALID", "Storage documental não está configurado corretamente.", { cause: error });
  }
  return new StorageError("STORAGE_UNAVAILABLE", message, { cause: error });
}

function expectedScopePrefix(scope: DocumentStorageScope) {
  assertStorageScope(scope);
  return `${scope.companyId}/${scope.employeeId}/`;
}

function resolveScopedPath(input: DocumentStorageReadInput) {
  if (!isVercelBlobDocumentStorageKey(input.storageKey)) {
    throw new StorageError("RESOURCE_NOT_FOUND", "Referência de storage inválida.");
  }

  const pathname = input.storageKey.slice(STORAGE_PREFIX.length).replaceAll("\\", "/");
  if (!pathname || pathname.includes("..") || pathname.startsWith("/")) {
    throw new StorageError("TENANT_ACCESS_DENIED", "Referência de storage inválida.");
  }
  if (!pathname.startsWith(expectedScopePrefix(input))) {
    throw new StorageError("TENANT_ACCESS_DENIED", "Arquivo fora do escopo autorizado.");
  }
  return pathname;
}

function originalNameFromPathname(pathname: string) {
  const storedName = pathname.split("/").at(-1) ?? "documento";
  const separator = storedName.indexOf(FILE_SEPARATOR);
  return separator >= 0 ? storedName.slice(separator + FILE_SEPARATOR.length) : storedName;
}

export function isVercelBlobDocumentStorageKey(storageKey: string | null | undefined) {
  return Boolean(storageKey?.startsWith(STORAGE_PREFIX));
}

export function createVercelBlobDocumentStorage(
  operations: VercelBlobOperations = sdkOperations,
): DocumentStorage {
  return {
    provider: "vercel-blob",

    async save(input) {
      assertStorageScope(input);
      const validated = await validateDocumentUpload(input.file);
      const safeName = sanitizeDocumentFileName(validated.originalName);
      const pathname = `${expectedScopePrefix(input)}${randomUUID()}${FILE_SEPARATOR}${safeName}`;

      try {
        const saved = await operations.putPrivate(pathname, validated.bytes, validated.mimeType);
        if (!saved.pathname.startsWith(expectedScopePrefix(input))) {
          throw new StorageError("TENANT_ACCESS_DENIED", "Provider retornou objeto fora do escopo autorizado.");
        }
        return {
          storageKey: `${STORAGE_PREFIX}${saved.pathname}`,
          originalName: safeName,
          mimeType: validated.mimeType,
          size: validated.bytes.byteLength,
          checksumSha256: validated.checksumSha256,
        };
      } catch (error) {
        throw asStorageError(error, "Não foi possível persistir o documento no storage gerenciado.");
      }
    },

    async read(input) {
      const pathname = resolveScopedPath(input);
      const originalName = originalNameFromPathname(pathname);
      const mimeType = mimeTypeFromDocumentName(originalName);
      if (!mimeType) {
        throw new StorageError("VALIDATION_FAILED", "Tipo de arquivo armazenado não reconhecido.");
      }

      try {
        const result = await operations.getPrivate(pathname);
        if (!result || result.statusCode !== 200 || !result.stream) {
          throw new StorageError("RESOURCE_NOT_FOUND", "Arquivo não encontrado.");
        }
        if (result.blob.pathname !== pathname) {
          throw new StorageError("TENANT_ACCESS_DENIED", "Provider retornou objeto fora do escopo autorizado.");
        }
        if (result.blob.contentType && result.blob.contentType !== mimeType) {
          throw new StorageError("VALIDATION_FAILED", "Metadado MIME do arquivo armazenado é inconsistente.");
        }

        const bytes = new Uint8Array(await new Response(result.stream).arrayBuffer());
        return {
          storageKey: input.storageKey,
          originalName,
          mimeType,
          size: bytes.byteLength,
          checksumSha256: createHash("sha256").update(bytes).digest("hex"),
          bytes,
        };
      } catch (error) {
        throw asStorageError(error, "Não foi possível ler o documento do storage gerenciado.");
      }
    },

    async delete(input) {
      const pathname = resolveScopedPath(input);
      try {
        await operations.delete(pathname);
      } catch (error) {
        throw asStorageError(error, "Não foi possível excluir o documento do storage gerenciado.");
      }
    },

    async health() {
      try {
        await operations.probe(HEALTHCHECK_PATH);
        return {
          ok: true,
          provider: "vercel-blob",
          persistent: true,
          productionSafe: true,
        };
      } catch (error) {
        // A not-found response proves the authenticated store can be reached without
        // creating a permanent healthcheck object.
        if (errorName(error) === "BlobNotFoundError") {
          return {
            ok: true,
            provider: "vercel-blob",
            persistent: true,
            productionSafe: true,
          };
        }
        return {
          ok: false,
          provider: "vercel-blob",
          persistent: true,
          productionSafe: true,
          code: configurationFailure(error) ? "CONFIGURATION_INVALID" : "STORAGE_UNAVAILABLE",
        };
      }
    },
  };
}

export const vercelBlobDocumentStorage = createVercelBlobDocumentStorage();
