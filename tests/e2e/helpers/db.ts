type QueryRow = Record<string, unknown>;
type QueryResult = { rows: QueryRow[]; rowCount: number | null };
type PoolLike = {
  query: (sql: string, params?: unknown[]) => Promise<QueryResult>;
  end: () => Promise<void>;
};
type PoolConstructor = new (options: { connectionString: string; max: number }) => PoolLike;

// The Playwright process is CommonJS-transpiled in this repository. Requiring pg here
// intentionally avoids importing the generated Prisma ESM client into the test runner.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Pool } = require("pg") as { Pool: PoolConstructor };

const AUTHORIZED_E2E_ENVIRONMENTS = new Set(["TEST", "HOMOLOGATION"]);
const DB_CONVERGENCE_ATTEMPTS = 20;
const DB_CONVERGENCE_DELAY_MS = 150;
let pool: PoolLike | null = null;

function connectionString() {
  const environment = process.env.BRAVHAS_ENV?.toUpperCase();
  if (!environment || !AUTHORIZED_E2E_ENVIRONMENTS.has(environment) || process.env.NODE_ENV === "production") {
    throw new Error("E2E_DB_FORBIDDEN_OUTSIDE_TEST_HOMOLOGATION");
  }

  const value = process.env.DATABASE_DIRECT_URL || process.env.DATABASE_URL;
  if (!value || !value.startsWith("postgresql://")) {
    throw new Error("E2E_DB_REQUIRES_DIRECT_POSTGRES_URL");
  }
  return value;
}

function getPool() {
  if (!pool) pool = new Pool({ connectionString: connectionString(), max: 2 });
  return pool;
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function dbOne<T extends QueryRow>(sql: string, params: unknown[] = []): Promise<T | null> {
  for (let attempt = 0; attempt < DB_CONVERGENCE_ATTEMPTS; attempt += 1) {
    const result = await getPool().query(sql, params);
    const row = result.rows[0] as T | undefined;
    if (row) return row;
    if (attempt < DB_CONVERGENCE_ATTEMPTS - 1) await delay(DB_CONVERGENCE_DELAY_MS);
  }
  return null;
}

export async function dbMany<T extends QueryRow>(sql: string, params: unknown[] = []): Promise<T[]> {
  const result = await getPool().query(sql, params);
  return result.rows as T[];
}

export async function dbExec(sql: string, params: unknown[] = []): Promise<number> {
  const result = await getPool().query(sql, params);
  return result.rowCount ?? 0;
}

export async function closeE2eDb() {
  if (!pool) return;
  const current = pool;
  pool = null;
  await current.end();
}
