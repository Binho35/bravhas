import { execFileSync } from 'node:child_process';

const allowedHigh = new Set([
  'GHSA-3f6p-5ww8-9rcr',
  'GHSA-rgwj-5xj2-c3m3',
]);

const AUDIT_TIMEOUT_MS = 120_000;

let raw;
try {
  raw = execFileSync('npm', ['audit', '--omit=dev', '--json'], {
    encoding: 'utf8',
    timeout: AUDIT_TIMEOUT_MS,
    killSignal: 'SIGTERM',
    env: {
      ...process.env,
      npm_config_fetch_retries: '2',
      npm_config_fetch_retry_mintimeout: '1000',
      npm_config_fetch_retry_maxtimeout: '10000',
    },
  });
} catch (error) {
  if (error?.code === 'ETIMEDOUT' || error?.signal === 'SIGTERM') {
    throw new Error(`Dependency audit timed out after ${AUDIT_TIMEOUT_MS / 1000}s; failing closed.`);
  }
  raw = error.stdout?.toString() ?? '';
}

if (!raw) throw new Error('Dependency audit produced no JSON output.');
const report = JSON.parse(raw);
const vulnerabilities = report.vulnerabilities ?? {};
const blocking = [];
const allowed = [];

for (const [name, item] of Object.entries(vulnerabilities)) {
  const severity = item.severity;
  if (!['high', 'critical'].includes(severity)) continue;
  const vias = Array.isArray(item.via) ? item.via : [];
  const advisories = vias.filter((via) => typeof via === 'object' && via.url).map((via) => via.url.split('/').pop());
  const isKnownPrismaMysql2 = name === 'mysql2' && advisories.length > 0 && advisories.every((id) => allowedHigh.has(id));
  if (isKnownPrismaMysql2) {
    allowed.push({ name, severity, advisories, fixAvailable: item.fixAvailable });
    continue;
  }
  blocking.push({ name, severity, advisories, fixAvailable: item.fixAvailable });
}

if (blocking.length) {
  console.error('Blocking production dependency advisories:', JSON.stringify(blocking, null, 2));
  process.exit(1);
}

for (const item of allowed) {
  console.warn(`MITIGATED HIGH: ${item.name} ${item.advisories.join(', ')} — transitive Prisma tooling dependency; no compatible non-breaking fix accepted.`);
}
console.log('Dependency audit passed: no unmitigated HIGH/CRITICAL production dependency advisories.');
