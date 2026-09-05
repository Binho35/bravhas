import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const STORAGE_PREFIX = "local:";
export const LOCAL_DOCUMENT_MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function storageRoot() {
  return path.join(process.cwd(), ".bravhas", "uploads");
}

function sanitizeFileName(name: string) {
  const base = path.basename(name || "documento");
  const safe = base
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");
  return safe || "documento";
}

function ensureLocalStorageAllowed() {
  if (process.env.NODE_ENV === "production" || process.env.BRAVHAS_ENV === "PRODUCTION") {
    throw new Error("Upload local não está habilitado em produção. Configure um storage persistente antes do deploy produtivo.");
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

export async function saveLocalDocumentFile(input: {
  companyId: string;
  employeeId: string;
  file: File;
}) {
  ensureLocalStorageAllowed();

  if (input.file.size <= 0) throw new Error("Selecione um arquivo para upload.");
  if (input.file.size > LOCAL_DOCUMENT_MAX_BYTES) throw new Error("O arquivo deve ter no máximo 5 MB.");
  if (!ALLOWED_MIME_TYPES.has(input.file.type)) {
    throw new Error("Formato não permitido. Envie PDF, JPG, PNG ou WEBP.");
  }

  const safeName = sanitizeFileName(input.file.name);
  const relative = path.join(input.companyId, input.employeeId, `${randomUUID()}-${safeName}`);
  const absolute = path.join(storageRoot(), relative);

  await mkdir(path.dirname(absolute), { recursive: true });
  const bytes = Buffer.from(await input.file.arrayBuffer());
  await writeFile(absolute, bytes, { flag: "wx" });

  return `${STORAGE_PREFIX}${relative.split(path.sep).join("/")}`;
}

export async function readLocalDocumentFile(storageKey: string) {
  ensureLocalStorageAllowed();
  if (!isLocalDocumentStorageKey(storageKey)) throw new Error("Referência de arquivo local inválida.");

  const relative = storageKey.slice(STORAGE_PREFIX.length);
  if (!relative || relative.includes("..") || path.isAbsolute(relative)) {
    throw new Error("Referência de arquivo local inválida.");
  }

  const root = storageRoot();
  const absolute = path.resolve(root, relative);
  const normalizedRoot = `${path.resolve(root)}${path.sep}`;
  if (!absolute.startsWith(normalizedRoot)) throw new Error("Referência de arquivo fora da área autorizada.");

  return readFile(absolute);
}
