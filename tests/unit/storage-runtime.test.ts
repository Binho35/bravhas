import assert from "node:assert/strict";
import test from "node:test";

import { StorageError } from "../../modules/hrdp/storage/documentStorage";
import {
  configuredDocumentStorageProvider,
  getDocumentStorage,
  getDocumentStorageHealth,
} from "../../modules/hrdp/storage/storageRuntime";

const PROVIDER_ENV = "BRAVHAS_DOCUMENT_STORAGE_PROVIDER";

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

test("production storage readiness fails closed when provider is missing", async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousBravhasEnv = process.env.BRAVHAS_ENV;
  const previousProvider = process.env[PROVIDER_ENV];

  process.env.NODE_ENV = "production";
  process.env.BRAVHAS_ENV = "PRODUCTION";
  delete process.env[PROVIDER_ENV];

  try {
    assert.equal(configuredDocumentStorageProvider(), "unconfigured");

    const health = await getDocumentStorageHealth();
    assert.equal(health.ok, false);
    assert.equal(health.persistent, false);
    assert.equal(health.productionSafe, false);
    assert.equal(health.code, "CONFIGURATION_INVALID");

    assert.throws(
      () => getDocumentStorage(),
      (error: unknown) => error instanceof StorageError && error.code === "CONFIGURATION_INVALID",
    );
  } finally {
    restoreEnv("NODE_ENV", previousNodeEnv);
    restoreEnv("BRAVHAS_ENV", previousBravhasEnv);
    restoreEnv(PROVIDER_ENV, previousProvider);
  }
});

test("production storage readiness fails closed for an unknown provider", async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousBravhasEnv = process.env.BRAVHAS_ENV;
  const previousProvider = process.env[PROVIDER_ENV];

  process.env.NODE_ENV = "production";
  process.env.BRAVHAS_ENV = "PRODUCTION";
  process.env[PROVIDER_ENV] = "unsupported-provider";

  try {
    assert.equal(configuredDocumentStorageProvider(), "unsupported-provider");

    const health = await getDocumentStorageHealth();
    assert.equal(health.ok, false);
    assert.equal(health.persistent, false);
    assert.equal(health.productionSafe, false);
    assert.equal(health.code, "CONFIGURATION_INVALID");

    assert.throws(
      () => getDocumentStorage(),
      (error: unknown) => error instanceof StorageError && error.code === "CONFIGURATION_INVALID",
    );
  } finally {
    restoreEnv("NODE_ENV", previousNodeEnv);
    restoreEnv("BRAVHAS_ENV", previousBravhasEnv);
    restoreEnv(PROVIDER_ENV, previousProvider);
  }
});
