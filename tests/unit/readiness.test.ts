import assert from "node:assert/strict";
import test from "node:test";

import type { StorageHealth } from "../../modules/hrdp/storage/documentStorage";
import {
  classifyBravhasRuntimeEnvironment,
  evaluateReadiness,
} from "../../lib/readiness";

const healthyBlob: StorageHealth = {
  ok: true,
  provider: "vercel-blob",
  persistent: true,
  productionSafe: true,
};

const unavailableBlob: StorageHealth = {
  ok: false,
  provider: "vercel-blob",
  persistent: true,
  productionSafe: true,
  code: "STORAGE_UNAVAILABLE",
};

test("BRAVHAS_ENV=PRODUCTION is classified as commercial production", () => {
  const environment = classifyBravhasRuntimeEnvironment("PRODUCTION", "development");
  assert.equal(environment.production, true);
  assert.equal(environment.label, "production");
});

test("Vercel Preview compiled with NODE_ENV=production remains homologation when BRAVHAS_ENV=HOMOLOGATION", () => {
  const environment = classifyBravhasRuntimeEnvironment("HOMOLOGATION", "production");
  assert.equal(environment.production, false);
  assert.equal(environment.label, "homologation");
});

test("database ready plus healthy private Blob returns 200/ready in homologation", () => {
  const readiness = evaluateReadiness(true, healthyBlob, "HOMOLOGATION", "production");
  assert.equal(readiness.ready, true);
  assert.equal(readiness.storageReady, true);
  assert.equal(readiness.statusCode, 200);
  assert.equal(readiness.label, "homologation");
});

test("database ready plus unhealthy Blob remains 503/blocked in homologation", () => {
  const readiness = evaluateReadiness(true, unavailableBlob, "HOMOLOGATION", "production");
  assert.equal(readiness.ready, false);
  assert.equal(readiness.storageReady, false);
  assert.equal(readiness.statusCode, 503);
  assert.equal(readiness.label, "homologation");
});

test("production keeps persistent and production-safe storage requirement", () => {
  const nonPersistentStorage: StorageHealth = {
    ok: true,
    provider: "test-provider",
    persistent: false,
    productionSafe: false,
  };
  const readiness = evaluateReadiness(true, nonPersistentStorage, "PRODUCTION", "production");
  assert.equal(readiness.ready, false);
  assert.equal(readiness.storageReady, false);
  assert.equal(readiness.statusCode, 503);
  assert.equal(readiness.production, true);
});
