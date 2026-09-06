import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

function isProduction(env) {
  return env.NODE_ENV === "production" || env.BRAVHAS_ENV === "PRODUCTION";
}

export function restoreExecutionAllowed(env, args) {
  if (isProduction(env)) return { ok: false, reason: "PRODUCTION_RESTORE_FORBIDDEN" };
  if (env.BRAVHAS_RESTORE_ALLOWED !== "true") return { ok: false, reason: "RESTORE_ENV_GUARD_REQUIRED" };
  if (!args.includes("--confirm-non-production")) return { ok: false, reason: "CONFIRMATION_FLAG_REQUIRED" };
  return { ok: true, reason: "ALLOWED" };
}

function connection() {
  const raw = process.env.DATABASE_DIRECT_URL || process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_DIRECT_URL ou DATABASE_URL é obrigatório para restore.");
  const url = new URL(raw);
  if (!url.protocol.startsWith("postgres")) throw new Error("A URL de banco não é PostgreSQL.");
  const database = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!database) throw new Error("DATABASE_IDENTIFIER_INVALID");
  return {
    host: url.hostname,
    port: url.port || "5432",
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database,
  };
}

function sha256(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

function selfTest() {
  const production = restoreExecutionAllowed(
    { NODE_ENV: "production", BRAVHAS_RESTORE_ALLOWED: "true" },
    ["--confirm-non-production"],
  );
  const missingGuard = restoreExecutionAllowed(
    { NODE_ENV: "development", BRAVHAS_RESTORE_ALLOWED: "false" },
    ["--confirm-non-production"],
  );
  const allowed = restoreExecutionAllowed(
    { NODE_ENV: "development", BRAVHAS_RESTORE_ALLOWED: "true" },
    ["--confirm-non-production"],
  );
  if (production.ok || missingGuard.ok || !allowed.ok) throw new Error("Restore guard self-test failed.");
  console.log("Restore safety guard self-test: PASS");
}

if (process.argv.includes("--self-test")) {
  selfTest();
  process.exit(0);
}

const execute = process.argv.includes("--execute");
const artifactArg = process.argv.find((value) => value.startsWith("--artifact="));
if (!artifactArg) throw new Error("Informe --artifact=/caminho/arquivo.dump.");
const artifactPath = path.resolve(artifactArg.split("=").slice(1).join("="));
const manifestPath = `${artifactPath}.manifest.json`;
if (!existsSync(artifactPath)) throw new Error("RESTORE_ARTIFACT_NOT_FOUND");
if (!existsSync(manifestPath)) throw new Error("RESTORE_MANIFEST_NOT_FOUND");

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
if (manifest.checksumAlgorithm !== "sha256" || typeof manifest.checksumSha256 !== "string") {
  throw new Error("RESTORE_MANIFEST_INVALID");
}
const actualChecksum = sha256(artifactPath);
if (actualChecksum !== manifest.checksumSha256) throw new Error("RESTORE_CHECKSUM_MISMATCH");

console.log(`RESTORE_MODE=${execute ? "EXECUTE" : "DRY_RUN"}`);
console.log(`SOURCE_ARTIFACT=${path.basename(artifactPath)}`);
console.log("CHECKSUM_VALID=PASS");

if (!execute) {
  console.log("RESTORE_DRY_RUN=PASS");
  process.exit(0);
}

const guard = restoreExecutionAllowed(process.env, process.argv);
if (!guard.ok) throw new Error(guard.reason);
const db = connection();

const result = spawnSync(
  "pg_restore",
  [
    "--clean",
    "--if-exists",
    "--no-owner",
    "--no-acl",
    `--host=${db.host}`,
    `--port=${db.port}`,
    `--username=${db.user}`,
    `--dbname=${db.database}`,
    artifactPath,
  ],
  { stdio: "inherit", env: { ...process.env, PGPASSWORD: db.password } },
);
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

const migrationStatus = spawnSync("npx", ["prisma", "migrate", "status"], {
  stdio: "inherit",
  env: process.env,
});
if (migrationStatus.error) throw migrationStatus.error;
if (migrationStatus.status !== 0) process.exit(migrationStatus.status ?? 1);

console.log("RESTORE_COMPLETED=PASS");
console.log("MIGRATION_STATUS=PASS");
console.log("POST_RESTORE_APPLICATION_VALIDATION=REQUIRED");
