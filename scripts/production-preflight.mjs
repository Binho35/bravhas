const REQUIRED = ["DATABASE_URL", "DATABASE_DIRECT_URL"];
const PRODUCTION_ONLY = ["BRAVHAS_DOCUMENT_STORAGE_PROVIDER"];
const OPTIONAL = ["SHADOW_DATABASE_URL"];
const DEVELOPMENT_ONLY = ["BRAVHAS_DEV_AUTH_BYPASS"];

function isProductionEnv(env) {
  return env.NODE_ENV === "production" || env.BRAVHAS_ENV === "PRODUCTION";
}

export function validateProductionEnvironment(env) {
  const errors = [];
  const production = isProductionEnv(env);

  for (const name of REQUIRED) {
    if (!env[name]?.trim()) errors.push(`${name}: REQUIRED_MISSING`);
  }

  if (production) {
    for (const name of PRODUCTION_ONLY) {
      if (!env[name]?.trim()) errors.push(`${name}: PRODUCTION_REQUIRED_MISSING`);
    }
    if (env.BRAVHAS_DEV_AUTH_BYPASS === "true") {
      errors.push("BRAVHAS_DEV_AUTH_BYPASS: FORBIDDEN_IN_PRODUCTION");
    }
    if (env.BRAVHAS_DOCUMENT_STORAGE_PROVIDER?.trim().toLowerCase() === "local") {
      errors.push("BRAVHAS_DOCUMENT_STORAGE_PROVIDER: LOCAL_FORBIDDEN_IN_PRODUCTION");
    }
  }

  return {
    ok: errors.length === 0,
    environment: production ? "production" : "non-production",
    errors,
    contract: {
      required: REQUIRED,
      productionOnly: PRODUCTION_ONLY,
      optional: OPTIONAL,
      developmentOnly: DEVELOPMENT_ONLY,
    },
  };
}

function selfTest() {
  const valid = validateProductionEnvironment({
    NODE_ENV: "production",
    BRAVHAS_ENV: "PRODUCTION",
    DATABASE_URL: "redacted",
    DATABASE_DIRECT_URL: "redacted",
    BRAVHAS_DOCUMENT_STORAGE_PROVIDER: "provider-adapter",
    BRAVHAS_DEV_AUTH_BYPASS: "false",
  });
  const missingStorage = validateProductionEnvironment({
    NODE_ENV: "production",
    DATABASE_URL: "redacted",
    DATABASE_DIRECT_URL: "redacted",
    BRAVHAS_DEV_AUTH_BYPASS: "false",
  });
  const unsafeLocal = validateProductionEnvironment({
    NODE_ENV: "production",
    DATABASE_URL: "redacted",
    DATABASE_DIRECT_URL: "redacted",
    BRAVHAS_DOCUMENT_STORAGE_PROVIDER: "local",
    BRAVHAS_DEV_AUTH_BYPASS: "true",
  });

  if (!valid.ok) throw new Error("Production preflight self-test rejected a valid contract.");
  if (missingStorage.ok) throw new Error("Production preflight self-test accepted missing storage configuration.");
  if (unsafeLocal.ok) throw new Error("Production preflight self-test accepted unsafe production configuration.");
  console.log("Production preflight contract self-test: PASS");
}

if (process.argv.includes("--self-test")) {
  selfTest();
  process.exit(0);
}

const result = validateProductionEnvironment(process.env);
console.log(`PRODUCTION_PREFLIGHT=${result.ok ? "PASS" : "BLOCKED"}`);
console.log(`ENVIRONMENT=${result.environment}`);
console.log(`ERROR_COUNT=${result.errors.length}`);
for (const error of result.errors) console.log(`ERROR=${error}`);

if (!result.ok) process.exit(1);
