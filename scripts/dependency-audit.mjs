import { execFileSync } from 'node:child_process';

const allowedHigh = new Set([
  'GHSA-3f6p-5ww8-9rcr',
  'GHSA-rgwj-5xj2-c3m3',
]);

const AUDIT_ATTEMPTS = 3;
const AUDIT_ATTEMPT_TIMEOUT_MS = 45_000;

function runAuditAttempt(attempt) {
  try {
    const stdout = execFileSync('npm', ['audit', '--omit=dev', '--json'], {
      encoding: 'utf8',
      timeout: AUDIT_ATTEMPT_TIMEOUT_MS,
      killSignal: 'SIGTERM',
      env: {
        ...process.env,
        npm_config_fetch_retries: '1',
        npm_config_fetch_retry_mintimeout: '1000',
        npm_config_fetch_retry_maxtimeout: '5000',
      },
    });
    return { raw: stdout, infrastructureFailure: false };
  } catch (error) {
    const stdout = error.stdout?.toString() ?? '';

    // npm audit exits non-zero when it found advisories. If it still emitted
    // JSON, that is a valid security report and must be evaluated immediately.
    if (stdout.trim()) {
      return { raw: stdout, infrastructureFailure: false };
    }

    const timedOut = error?.code === 'ETIMEDOUT' || error?.signal === 'SIGTERM';
    const reason = timedOut
      ? `timed out after ${AUDIT_ATTEMPT_TIMEOUT_MS / 1000}s`
      : `failed without JSON output${error?.status != null ? ` (exit ${error.status})` : ''}`;

    console.warn(`Dependency audit attempt ${attempt}/${AUDIT_ATTEMPTS} ${reason}.`);
    return { raw: '', infrastructureFailure: true };
  }
}

let raw = '';
for (let attempt = 1; attempt <= AUDIT_ATTEMPTS; attempt += 1) {
  const result = runAuditAttempt(attempt);
  if (result.raw.trim()) {
    raw = result.raw;
    break;
  }

  if (!result.infrastructureFailure) break;
}

if (!raw) {
  throw new Error(
    `Dependency audit could not obtain a valid registry report after ${AUDIT_ATTEMPTS} bounded attempts; failing closed.`,
  );
}

let report;
try {
  report = JSON.parse(raw);
} catch {
  throw new Error('Dependency audit returned invalid JSON; failing closed.');
}

const vulnerabilities = report.vulnerabilities ?? {};
const blocking = [];
const allowed = [];

for (const [name, item] of Object.entries(vulnerabilities)) {
  const severity = item.severity;
  if (!['high', 'critical'].includes(severity)) continue;

  const vias = Array.isArray(item.via) ? item.via : [];
  const advisories = vias
    .filter((via) => typeof via === 'object' && via.url)
    .map((via) => via.url.split('/').pop());

  const isKnownPrismaMysql2 =
    name === 'mysql2' &&
    advisories.length > 0 &&
    advisories.every((id) => allowedHigh.has(id));

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
  console.warn(
    `MITIGATED HIGH: ${item.name} ${item.advisories.join(', ')} — transitive Prisma tooling dependency; no compatible non-breaking fix accepted.`,
  );
}

console.log('Dependency audit passed: no unmitigated HIGH/CRITICAL production dependency advisories.');
