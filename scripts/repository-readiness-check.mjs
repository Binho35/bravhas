import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const failures = [];

async function read(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

function requireText(content, expected, label) {
  if (!content.includes(expected)) failures.push(`${label}: ausente '${expected}'`);
}

async function collectFiles(relativeDir) {
  const base = path.join(root, relativeDir);
  const files = [];

  async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (["node_modules", ".next", ".git"].includes(entry.name)) continue;
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(absolute);
      else if (/\.(ts|tsx|js|mjs|cjs|json|yml|yaml)$/.test(entry.name)) files.push(absolute);
    }
  }

  await walk(base);
  return files;
}

const nextConfig = await read("next.config.ts");
for (const expected of [
  "X-Content-Type-Options",
  "nosniff",
  "X-Frame-Options",
  "DENY",
  "Referrer-Policy",
  "Permissions-Policy",
  "poweredByHeader: false",
]) requireText(nextConfig, expected, "next.config.ts");

const envExample = await read(".env.example");
for (const expected of ["DATABASE_URL=", "DATABASE_DIRECT_URL=", "BRAVHAS_ENV=", "BRAVHAS_DEV_AUTH_BYPASS=false"]) {
  requireText(envExample, expected, ".env.example");
}

const readme = await read("README.md");
requireText(readme, "BravHAS", "README.md");
requireText(readme, "Repository Ready", "README.md");
if (readme.includes("create-next-app") && readme.includes("This is a [Next.js]")) {
  failures.push("README.md ainda parece o template padrão do create-next-app");
}

const productionFiles = [
  ...(await collectFiles("app")),
  ...(await collectFiles("modules")),
  ...(await collectFiles("lib")),
];

for (const absolute of productionFiles) {
  const content = await readFile(absolute, "utf8");
  const relative = path.relative(root, absolute);
  if (/\$(queryRawUnsafe|executeRawUnsafe)\b/.test(content)) failures.push(`${relative}: SQL unsafe proibido`);
  if (/BRAVHAS_DEV_AUTH_BYPASS\s*[=:]\s*["']?true/i.test(content)) failures.push(`${relative}: auth bypass habilitado`);
}

const authFiles = await collectFiles("modules/auth");
for (const absolute of authFiles) {
  const content = await readFile(absolute, "utf8");
  if (/\blocalStorage\b/.test(content)) failures.push(`${path.relative(root, absolute)}: localStorage não pode ser fonte de auth`);
}

const apiHandlerFiles = await collectFiles("app/api");
apiHandlerFiles.push(path.join(root, "app/financeiro/contas/route.ts"));
for (const absolute of apiHandlerFiles) {
  const content = await readFile(absolute, "utf8");
  const relative = path.relative(root, absolute);
  if (/message\s*:\s*error\s+instanceof\s+Error\s*\?\s*error\.message/.test(content)) {
    failures.push(`${relative}: resposta expõe error.message sem allowlist`);
  }
  if (/console\.error\([^;]*,\s*error\s*\)/s.test(content)) {
    failures.push(`${relative}: log server-side despeja objeto de erro completo`);
  }
}

const operationalFiles = [
  ...(await collectFiles("scripts")),
  ...(await collectFiles("prisma")),
  ...(await collectFiles(".github")),
];
for (const absolute of operationalFiles) {
  const content = await readFile(absolute, "utf8");
  const relative = path.relative(root, absolute);
  if (/db\s+push\s+--accept-data-loss/i.test(content)) failures.push(`${relative}: db push destrutivo proibido`);
  if (/prisma\s+migrate\s+reset/i.test(content)) failures.push(`${relative}: migrate reset proibido`);
}

if (failures.length) {
  console.error("Repository readiness gate FAILED:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Repository readiness gate PASSED");
