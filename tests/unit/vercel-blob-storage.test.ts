import assert from "node:assert/strict";
import test from "node:test";

import {
  BlobAccessError,
  BlobNotFoundError,
  BlobServiceNotAvailable,
} from "@vercel/blob";

import { StorageError } from "../../modules/hrdp/storage/documentStorage";
import {
  createVercelBlobDocumentStorage,
  type VercelBlobOperations,
} from "../../modules/hrdp/storage/vercelBlobDocumentStorage";

function streamBytes(bytes: Uint8Array) {
  const copy = Uint8Array.from(bytes);
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(copy);
      controller.close();
    },
  });
}

function memoryOperations(): VercelBlobOperations {
  const objects = new Map<string, { bytes: Uint8Array; contentType: "application/pdf" }>();
  return {
    async putPrivate(pathname, bytes, contentType) {
      assert.equal(contentType, "application/pdf");
      objects.set(pathname, { bytes: Uint8Array.from(bytes), contentType });
      return { pathname };
    },
    async getPrivate(pathname) {
      const stored = objects.get(pathname);
      if (!stored) return null;
      return {
        statusCode: 200,
        stream: streamBytes(stored.bytes),
        blob: {
          pathname,
          contentType: stored.contentType,
          size: stored.bytes.byteLength,
        },
      };
    },
    async delete(pathname) {
      objects.delete(pathname);
    },
    async probe() {
      throw new BlobNotFoundError();
    },
  };
}

async function expectStorageError(fn: () => Promise<unknown>, code: StorageError["code"]) {
  await assert.rejects(fn, (error: unknown) => error instanceof StorageError && error.code === code);
}

function restoreEnv(name: string, previous: string | undefined) {
  if (previous === undefined) delete process.env[name];
  else process.env[name] = previous;
}

test("Vercel Blob private adapter satisfies save/read/delete, checksum, health and tenant scope", async () => {
  const storage = createVercelBlobDocumentStorage(memoryOperations());
  const scope = { companyId: "tenant-alpha", employeeId: "employee-1" };
  const foreign = { companyId: "tenant-beta", employeeId: "employee-1" };
  const file = new File(["%PDF-1.7\nprivate-contract"], "Contrato João.pdf", { type: "application/pdf" });

  const saved = await storage.save({ ...scope, file });
  assert.match(saved.storageKey, /^vercel-blob:tenant-alpha\/employee-1\//);
  assert.equal(saved.originalName, "Contrato-Joao.pdf");
  assert.equal(saved.size, file.size);
  assert.match(saved.checksumSha256, /^[a-f0-9]{64}$/);

  const read = await storage.read({ ...scope, storageKey: saved.storageKey });
  assert.equal(read.checksumSha256, saved.checksumSha256);
  assert.equal(read.mimeType, "application/pdf");
  assert.equal(read.originalName, saved.originalName);
  assert.deepEqual(Array.from(read.bytes), Array.from(new Uint8Array(await file.arrayBuffer())));

  await expectStorageError(
    () => storage.read({ ...foreign, storageKey: saved.storageKey }),
    "TENANT_ACCESS_DENIED",
  );
  await expectStorageError(
    () => storage.delete({ ...foreign, storageKey: saved.storageKey }),
    "TENANT_ACCESS_DENIED",
  );

  const health = await storage.health();
  assert.equal(health.ok, true);
  assert.equal(health.provider, "vercel-blob");
  assert.equal(health.persistent, true);
  assert.equal(health.productionSafe, true);

  await storage.delete({ ...scope, storageKey: saved.storageKey });
  await expectStorageError(
    () => storage.read({ ...scope, storageKey: saved.storageKey }),
    "RESOURCE_NOT_FOUND",
  );
});

test("Vercel Blob health is ready when probe succeeds directly", async () => {
  const operations = memoryOperations();
  operations.probe = async () => {};
  const health = await createVercelBlobDocumentStorage(operations).health();
  assert.equal(health.ok, true);
  assert.equal(health.provider, "vercel-blob");
  assert.equal(health.persistent, true);
  assert.equal(health.productionSafe, true);
});

test("Vercel Blob health treats typed BlobNotFoundError from intentional probe as reachability", async () => {
  const operations = memoryOperations();
  operations.probe = async () => {
    throw new BlobNotFoundError();
  };
  const health = await createVercelBlobDocumentStorage(operations).health();
  assert.equal(health.ok, true);
  assert.equal(health.provider, "vercel-blob");
  assert.equal(health.persistent, true);
  assert.equal(health.productionSafe, true);
});

test("Vercel Blob health fails closed on typed authentication error", async () => {
  const operations = memoryOperations();
  operations.probe = async () => {
    throw new BlobAccessError();
  };
  const health = await createVercelBlobDocumentStorage(operations).health();
  assert.equal(health.ok, false);
  assert.equal(health.code, "CONFIGURATION_INVALID");
});

test("Vercel Blob health reports real provider unavailability as STORAGE_UNAVAILABLE", async () => {
  const operations = memoryOperations();
  operations.probe = async () => {
    throw new BlobServiceNotAvailable();
  };
  const health = await createVercelBlobDocumentStorage(operations).health();
  assert.equal(health.ok, false);
  assert.equal(health.code, "STORAGE_UNAVAILABLE");
});

test("Vercel Blob health diagnostic is sanitized and public health response stays generic", async () => {
  const operations = memoryOperations();
  const previousToken = process.env.BLOB_READ_WRITE_TOKEN;
  const previousStoreId = process.env.BLOB_STORE_ID;
  const previousDatabaseUrl = process.env.DATABASE_URL;
  const token = "vercel_blob_rw_test-secret-token";
  const storeId = "store_test-secret-store";
  const databaseUrl = "postgresql://user:super-secret-password@db.example.com:5432/bravhas";
  const logs: unknown[][] = [];
  const originalConsoleError = console.error;

  process.env.BLOB_READ_WRITE_TOKEN = token;
  process.env.BLOB_STORE_ID = storeId;
  process.env.DATABASE_URL = databaseUrl;

  operations.probe = async () => {
    const error = new Error(
      `provider unavailable token=${token} store=${storeId} database=${databaseUrl}`,
    ) as Error & { code: string; statusCode: number };
    error.name = "BlobServiceNotAvailable";
    error.code = "EUPSTREAM";
    error.statusCode = 503;
    throw error;
  };

  console.error = (...args: unknown[]) => {
    logs.push(args);
  };

  try {
    const health = await createVercelBlobDocumentStorage(operations).health();
    assert.equal(health.ok, false);
    assert.equal(health.code, "STORAGE_UNAVAILABLE");

    const publicResponse = JSON.stringify(health);
    assert.doesNotMatch(publicResponse, /test-secret-token/);
    assert.doesNotMatch(publicResponse, /test-secret-store/);
    assert.doesNotMatch(publicResponse, /super-secret-password/);

    assert.equal(logs.length, 1);
    const diagnostic = JSON.stringify(logs[0]);
    assert.match(diagnostic, /BRAVHAS_DIAGNOSTIC/);
    assert.match(diagnostic, /vercel-blob-healthcheck/);
    assert.match(diagnostic, /BlobServiceNotAvailable/);
    assert.match(diagnostic, /EUPSTREAM/);
    assert.match(diagnostic, /503/);
    assert.doesNotMatch(diagnostic, /test-secret-token/);
    assert.doesNotMatch(diagnostic, /test-secret-store/);
    assert.doesNotMatch(diagnostic, /super-secret-password/);
    assert.doesNotMatch(diagnostic, /postgresql:\/\//);
  } finally {
    console.error = originalConsoleError;
    restoreEnv("BLOB_READ_WRITE_TOKEN", previousToken);
    restoreEnv("BLOB_STORE_ID", previousStoreId);
    restoreEnv("DATABASE_URL", previousDatabaseUrl);
  }
});

test("Vercel Blob read maps typed BlobNotFoundError to RESOURCE_NOT_FOUND", async () => {
  const operations = memoryOperations();
  operations.getPrivate = async () => {
    throw new BlobNotFoundError();
  };
  const storage = createVercelBlobDocumentStorage(operations);
  await expectStorageError(
    () => storage.read({
      companyId: "tenant-alpha",
      employeeId: "employee-1",
      storageKey: "vercel-blob:tenant-alpha/employee-1/missing--document.pdf",
    }),
    "RESOURCE_NOT_FOUND",
  );
});
