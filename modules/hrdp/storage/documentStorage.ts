import { createHash } from "node:crypto";
import path from "node:path";

// Vercel server uploads are limited to 4.5 MB including request overhead.
// Keep the application contract at 4 MB while uploads remain server-side.
export const DOCUMENT_STORAGE_MAX_BYTES = 4 * 1024 * 1024;

export const DOCUMENT_STORAGE_ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type DocumentStorageMimeType = (typeof DOCUMENT_STORAGE_ALLOWED_MIME_TYPES)[number];

export type StorageErrorCode =
  | "VALIDATION_FAILED"
  | "TENANT_ACCESS_DENIED"
  | "RESOURCE_NOT_FOUND"
  | "STORAGE_UNAVAILABLE"
  | "CONFIGURATION_INVALID";

export class StorageError extends Error {
  constructor(
    public readonly code: StorageErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "StorageError";
  }
}

export type DocumentStorageScope = {
  companyId: string;
  employeeId: string;
};

export type DocumentStorageWriteInput = DocumentStorageScope & {
  file: File;
};

export type DocumentStorageReadInput = DocumentStorageScope & {
  storageKey: string;
};

export type DocumentStorageDeleteInput = DocumentStorageReadInput;

export type StoredDocument = {
  storageKey: string;
  originalName: string;
  mimeType: DocumentStorageMimeType;
  size: number;
  checksumSha256: string;
};

export type ReadDocument = StoredDocument & {
  bytes: Uint8Array;
};

export type StorageHealth = {
  ok: boolean;
  provider: string;
  persistent: boolean;
  productionSafe: boolean;
  code?: StorageErrorCode;
};

export interface DocumentStorage {
  readonly provider: string;
  save(input: DocumentStorageWriteInput): Promise<StoredDocument>;
  read(input: DocumentStorageReadInput): Promise<ReadDocument>;
  delete(input: DocumentStorageDeleteInput): Promise<void>;
  health(): Promise<StorageHealth>;
}

const EXTENSIONS_BY_MIME: Record<DocumentStorageMimeType, readonly string[]> = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

function validationError(message: string) {
  return new StorageError("VALIDATION_FAILED", message);
}

export function assertDocumentUploadPolicy(file: File) {
  if (file.size <= 0) throw validationError("Selecione um arquivo para upload.");
  if (file.size > DOCUMENT_STORAGE_MAX_BYTES) throw validationError("O arquivo deve ter no máximo 4 MB.");
  if (!DOCUMENT_STORAGE_ALLOWED_MIME_TYPES.includes(file.type as DocumentStorageMimeType)) {
    throw validationError("Formato não permitido. Envie PDF, JPG, PNG ou WEBP.");
  }

  const mimeType = file.type as DocumentStorageMimeType;
  const extension = path.extname(file.name).toLowerCase();
  if (!EXTENSIONS_BY_MIME[mimeType].includes(extension)) {
    throw validationError("A extensão do arquivo não corresponde ao formato informado.");
  }
}

export function assertStorageScope(scope: DocumentStorageScope) {
  const safeId = /^[A-Za-z0-9_-]{1,128}$/;
  if (!safeId.test(scope.companyId) || !safeId.test(scope.employeeId)) {
    throw new StorageError("TENANT_ACCESS_DENIED", "Escopo de storage inválido.");
  }
}

export function sanitizeDocumentFileName(name: string) {
  const base = path.basename(name || "documento");
  const safe = base
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");
  return (safe || "documento").slice(0, 180);
}

export function mimeTypeFromDocumentName(name: string): DocumentStorageMimeType | null {
  const extension = path.extname(name).toLowerCase();
  for (const mimeType of DOCUMENT_STORAGE_ALLOWED_MIME_TYPES) {
    if (EXTENSIONS_BY_MIME[mimeType].includes(extension)) return mimeType;
  }
  return null;
}

function hasExpectedSignature(bytes: Uint8Array, mimeType: DocumentStorageMimeType) {
  if (mimeType === "application/pdf") {
    return bytes.length >= 5 && String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-";
  }
  if (mimeType === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mimeType === "image/png") {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return bytes.length >= signature.length && signature.every((value, index) => bytes[index] === value);
  }
  return (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  );
}

export async function validateDocumentUpload(file: File) {
  assertDocumentUploadPolicy(file);
  const mimeType = file.type as DocumentStorageMimeType;
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!hasExpectedSignature(bytes, mimeType)) {
    throw validationError("O conteúdo do arquivo não corresponde ao formato permitido.");
  }

  return {
    bytes,
    mimeType,
    originalName: sanitizeDocumentFileName(file.name),
    checksumSha256: createHash("sha256").update(bytes).digest("hex"),
  };
}
