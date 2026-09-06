import assert from "node:assert/strict";
import test from "node:test";

import {
  configuredDocumentStorageProvider,
  getDocumentStorage,
  getDocumentStorageHealth,
  isManagedDocumentStorageKey,
} from "../../modules/hrdp/storage/storageRuntime";

const PROVIDER_ENV = "BRAVHAS_DOCUMENT_STORAGE_PROVIDER";

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

test("production storage readiness fails closed when provider is missing", async () => {
  const previousBravhasEnv = process.env.BRAVHAS_ENV;
  const previousProvider = process.env[PROVIDER_ENV];

  process.env.BRAVHAS_ENV = "PRODUCTION";
  delete process.env[PROVIDER_ENV];

  try {
    assert.equal(configuredDocumentStorageProvider(), "unconfigured");

    const health = await getDocumentStorageHealth();
    assert.equal(health.ok, false);
    assert.equal(health.provider, "unconfigured");
    assert.equal(health.persistent, false);
    assert.equal(health.productionSafe, false);
    assert.equal(health.code, "CONFIGURATION_INVALID");
  } finally {
    restoreEnv("BRAVHAS_ENV", previousBravhasEnv);
    restoreEnv(PROVIDER_ENV, previousProvider);
  }
});

test("production storage readiness fails closed for an unknown provider", async () => {
  const previousBravhasEnv = process.env.BRAVHAS_ENV;
  const previousProvider = process.env[PROVIDER_ENV];

  process.env.BRAVHAS_ENV = "PRODUCTION";
  process.env[PROVIDER_ENV] = "unsupported-provider";

  try {
    assert.equal(configuredDocumentStorageProvider(), "unsupported-provider");

    const health = await getDocumentStorageHealth();
    assert.equal(health.ok, false);
    assert.equal(health.provider, "unsupported-provider");
    assert.equal(health.persistent, false);
    assert.equal(health.productionSafe, false);
    assert.equal(health.code, "CONFIGURATION_INVALID");
  } finally {
    restoreEnv("BRAVHAS_ENV", previousBravhasEnv);
    restoreEnv(PROVIDER_ENV, previousProvider);
  }
});

test("homologation runtime selects Vercel Blob explicitly without weakening unknown-provider fail-closed", () => {
  const previousBravhasEnv = process.env.BRAVHAS_ENV;
  const previousProvider = process.env[PROVIDER_ENV];

  process.env.BRAVHAS_ENV = "HOMOLOGATION";
  process.env[PROVIDER_ENV] = "vercel-blob";

  try {
    assert.equal(configuredDocumentStorageProvider(), "vercel-blob");
    assert.equal(getDocumentStorage().provider, "vercel-blob");
    assert.equal(isManagedDocumentStorageKey("vercel-blob:tenant-a/employee-a/file.pdf"), true);
    assert.equal(isManagedDocumentStorageKey("local:tenant-a/employee-a/file.pdf"), true);
    assert.equal(isManagedDocumentStorageKey("https://example.invalid/document.pdf"), false);
  } finally {
    restoreEnv("BRAVHAS_ENV", previousBravhasEnv);
    restoreEnv(PROVIDER_ENV, previousProvider);
  }
});
