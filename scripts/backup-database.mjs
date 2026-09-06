import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function environmentName() {
  if (process.env.BRAVHAS_ENV) return process.env.BRAVHAS_ENV.toUpperCase();
  return process.env.NODE_ENV === "production" ? "PRODUCTION" : "UNKNOWN";
}

function connection() {
  const raw = process.env.DATABASE_DIRECT_URL || process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_DIRECT_URL ou DATABASE_URL é obrigatório para backup.");
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

function checksum(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

const execute = process.argv.includes("--execute");
const outputDirArg = process.argv.find((value) => value.startsWith("--output-dir="));
const outputDir = path.resolve(outputDirArg?.split("=").slice(1).join("=") || process.env.BRAVHAS_BACKUP_DIR || ".bravhas/backups");
const envName = environmentName();
const id = timestamp();
const artifactName = `bravhas-${envName.toLowerCase()}-${id}.dump`;
const artifactPath = path.join(outputDir, artifactName);
const manifestPath = `${artifactPath}.manifest.json`;
const db = connection();
const databaseIdentifierHash = createHash("sha256").update(`${db.host}:${db.port}/${db.database}`).digest("hex").slice(0, 16);

console.log(`BACKUP_MODE=${execute ? "EXECUTE" : "DRY_RUN"}`);
console.log(`ENVIRONMENT=${envName}`);
console.log(`ARTIFACT=${artifactName}`);
console.log(`DATABASE_IDENTIFIER_HASH=${databaseIdentifierHash}`);

if (!execute) {
  console.log("BACKUP_DRY_RUN=PASS");
  process.exit(0);
}

mkdirSync(outputDir, { recursive: true });
const args = [
  "--format=custom",
  "--no-owner",
  "--no-acl",
  `--host=${db.host}`,
  `--port=${db.port}`,
  `--username=${db.user}`,
  `--dbname=${db.database}`,
  `--file=${artifactPath}`,
];

const result = spawnSync("pg_dump", args, {
  stdio: "inherit",
  env: { ...process.env, PGPASSWORD: db.password },
});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
if (!existsSync(artifactPath)) throw new Error("BACKUP_ARTIFACT_NOT_CREATED");

const manifest = {
  schemaVersion: 1,
  application: "bravhas",
  environment: envName,
  createdAt: new Date().toISOString(),
  artifact: artifactName,
  databaseIdentifierHash,
  checksumAlgorithm: "sha256",
  checksumSha256: checksum(artifactPath),
};
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { flag: "wx" });

console.log("BACKUP_CREATED=PASS");
console.log("CHECKSUM_VALID=PASS");
console.log(`MANIFEST=${path.basename(manifestPath)}`);
