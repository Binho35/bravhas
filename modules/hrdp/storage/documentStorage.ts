export const DOCUMENT_STORAGE_MAX_BYTES = 5 * 1024 * 1024;

export const DOCUMENT_STORAGE_ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type DocumentStorageMimeType = (typeof DOCUMENT_STORAGE_ALLOWED_MIME_TYPES)[number];

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
  mimeType: string;
  size: number;
};

export type ReadDocument = StoredDocument & {
  bytes: Uint8Array;
};

export interface DocumentStorage {
  readonly provider: string;
  save(input: DocumentStorageWriteInput): Promise<StoredDocument>;
  read(input: DocumentStorageReadInput): Promise<ReadDocument>;
  delete(input: DocumentStorageDeleteInput): Promise<void>;
  health(): Promise<{ ok: boolean; provider: string }>;
}

export function assertDocumentUploadPolicy(file: File) {
  if (file.size <= 0) throw new Error("Selecione um arquivo para upload.");
  if (file.size > DOCUMENT_STORAGE_MAX_BYTES) throw new Error("O arquivo deve ter no máximo 5 MB.");
  if (!DOCUMENT_STORAGE_ALLOWED_MIME_TYPES.includes(file.type as DocumentStorageMimeType)) {
    throw new Error("Formato não permitido. Envie PDF, JPG, PNG ou WEBP.");
  }
}

export function assertStorageScope(scope: DocumentStorageScope) {
  if (!scope.companyId.trim() || !scope.employeeId.trim()) {
    throw new Error("Escopo de storage inválido.");
  }
}
