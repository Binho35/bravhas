import assert from "node:assert/strict";
import test from "node:test";

import {
  StorageError,
  assertDocumentUploadPolicy,
  assertStorageScope,
  sanitizeDocumentFileName,
  validateDocumentUpload,
} from "../../modules/hrdp/storage/documentStorage";
import { localDocumentStorage } from "../../modules/hrdp/storage/localDocumentStorage";

function expectStorageError(fn: () => unknown, code: StorageError["code"]) {
  assert.throws(fn, (error: unknown) => error instanceof StorageError && error.code === code);
}

async function expectAsyncStorageError(fn: () => Promise<unknown>, code: StorageError["code"]) {
  await assert.rejects(fn, (error: unknown) => error instanceof StorageError && error.code === code);
}

test("sanitizes uploaded document names", () => {
  assert.equal(sanitizeDocumentFileName("../../Contrato João 01.pdf"), "Contrato-Joao-01.pdf");
});

test("rejects scope traversal before reaching a provider", () => {
  expectStorageError(
    () => assertStorageScope({ companyId: "../tenant", employeeId: "employee-1" }),
    "TENANT_ACCESS_DENIED",
  );
  expectStorageError(
    () => assertStorageScope({ companyId: "tenant-1", employeeId: "employee/other" }),
    "TENANT_ACCESS_DENIED",
  );
});

test("rejects MIME and extension mismatch", () => {
  const file = new File(["%PDF-1.7\n"], "document.png", { type: "application/pdf" });
  expectStorageError(() => assertDocumentUploadPolicy(file), "VALIDATION_FAILED");
});

test("rejects spoofed PDF content even with allowed MIME and extension", async () => {
  const file = new File(["not-a-pdf"], "document.pdf", { type: "application/pdf" });
  await expectAsyncStorageError(() => validateDocumentUpload(file), "VALIDATION_FAILED");
});

test("accepts valid PDF signature and returns checksum metadata", async () => {
  const file = new File(["%PDF-1.7\nminimal"], "document.pdf", { type: "application/pdf" });
  const result = await validateDocumentUpload(file);
  assert.equal(result.mimeType, "application/pdf");
  assert.equal(result.originalName, "document.pdf");
  assert.equal(result.bytes.byteLength, file.size);
  assert.match(result.checksumSha256, /^[a-f0-9]{64}$/);
});

test("local adapter satisfies save/read/delete, checksum and tenant-scope contract in non-production", async () => {
  const scope = {
    companyId: `contract-company-${process.pid}`,
    employeeId: `contract-employee-${process.pid}`,
  };
  const foreignScope = {
    companyId: `contract-company-foreign-${process.pid}`,
    employeeId: scope.employeeId,
  };
  const file = new File(["%PDF-1.7\ncontract-conformance"], "contrato-conformidade.pdf", {
    type: "application/pdf",
  });

  let storageKey: string | undefined;
  try {
    const saved = await localDocumentStorage.save({ ...scope, file });
    storageKey = saved.storageKey;
    assert.match(saved.checksumSha256, /^[a-f0-9]{64}$/);
    assert.equal(saved.size, file.size);
    assert.equal(saved.mimeType, "application/pdf");

    const read = await localDocumentStorage.read({ ...scope, storageKey });
    assert.equal(read.checksumSha256, saved.checksumSha256);
    assert.equal(read.size, saved.size);
    assert.deepEqual(Array.from(read.bytes), Array.from(new Uint8Array(await file.arrayBuffer())));

    await expectAsyncStorageError(
      () => localDocumentStorage.read({ ...foreignScope, storageKey: storageKey! }),
      "TENANT_ACCESS_DENIED",
    );
    await expectAsyncStorageError(
      () => localDocumentStorage.delete({ ...foreignScope, storageKey: storageKey! }),
      "TENANT_ACCESS_DENIED",
    );

    const health = await localDocumentStorage.health();
    assert.equal(health.ok, true);
    assert.equal(health.persistent, false);
    assert.equal(health.productionSafe, false);

    await localDocumentStorage.delete({ ...scope, storageKey });
    await expectAsyncStorageError(
      () => localDocumentStorage.read({ ...scope, storageKey: storageKey! }),
      "RESOURCE_NOT_FOUND",
    );
    storageKey = undefined;
  } finally {
    if (storageKey) {
      try {
        await localDocumentStorage.delete({ ...scope, storageKey });
      } catch {
        // Best-effort cleanup in the ephemeral test workspace.
      }
    }
  }
});
