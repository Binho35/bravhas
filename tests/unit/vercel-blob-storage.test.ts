import assert from "node:assert/strict";
import test from "node:test";

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
      const error = new Error("health object intentionally absent");
      error.name = "BlobNotFoundError";
      throw error;
    },
  };
}

async function expectStorageError(fn: () => Promise<unknown>, code: StorageError["code"]) {
  await assert.rejects(fn, (error: unknown) => error instanceof StorageError && error.code === code);
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

test("Vercel Blob health fails closed when provider authentication is unavailable", async () => {
  const operations = memoryOperations();
  operations.probe = async () => {
    const error = new Error("credential unavailable");
    error.name = "BlobAccessError";
    throw error;
  };
  const health = await createVercelBlobDocumentStorage(operations).health();
  assert.equal(health.ok, false);
  assert.equal(health.persistent, true);
  assert.equal(health.productionSafe, true);
  assert.equal(health.code, "CONFIGURATION_INVALID");
});
