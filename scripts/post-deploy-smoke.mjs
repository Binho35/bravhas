function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name}: REQUIRED_MISSING`);
  return value;
}

function normalizeBaseUrl(value) {
  const url = new URL(value);
  if (!/^https?:$/.test(url.protocol)) throw new Error("BRAVHAS_BASE_URL: INVALID_PROTOCOL");
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new Error("BRAVHAS_BASE_URL: HTTPS_REQUIRED_IN_PRODUCTION");
  }
  return url.toString().replace(/\/$/, "");
}

async function jsonRequest(url, options = {}) {
  const response = await fetch(url, { redirect: "manual", ...options });
  let body = null;
  try {
    body = await response.json();
  } catch {
    // Endpoints HTML não possuem JSON; o status continua sendo validado pelo chamador.
  }
  return { response, body };
}

const baseUrl = normalizeBaseUrl(required("BRAVHAS_BASE_URL"));
const loginId = required("BRAVHAS_SMOKE_LOGIN_ID");
const password = required("BRAVHAS_SMOKE_PASSWORD");

const health = await jsonRequest(`${baseUrl}/api/health`);
if (health.response.status !== 200 || health.body?.status !== "ok") throw new Error("HEALTH_CHECK_FAILED");
console.log("HEALTH=PASS");

const readiness = await jsonRequest(`${baseUrl}/api/readiness`);
if (readiness.response.status !== 200 || readiness.body?.status !== "ready") throw new Error("READINESS_CHECK_FAILED");
console.log("READINESS=PASS");

const login = await jsonRequest(`${baseUrl}/api/auth/login`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ loginId, password }),
});
if (login.response.status !== 200 || login.body?.success !== true) throw new Error("LOGIN_SMOKE_FAILED");
const setCookie = login.response.headers.get("set-cookie");
const sessionCookie = setCookie?.split(";", 1)[0];
if (!sessionCookie) throw new Error("SESSION_COOKIE_MISSING");
console.log("LOGIN=PASS");

const dashboard = await fetch(`${baseUrl}/`, {
  headers: { cookie: sessionCookie },
  redirect: "manual",
});
if (dashboard.status !== 200) throw new Error("DASHBOARD_SMOKE_FAILED");
console.log("DASHBOARD=PASS");

const indicators = await jsonRequest(`${baseUrl}/api/indicadores`, {
  headers: { cookie: sessionCookie },
});
if (indicators.response.status !== 200 || indicators.body?.success !== true) throw new Error("CRITICAL_API_SMOKE_FAILED");
console.log("CRITICAL_API=PASS");

const foreignDocumentId = process.env.BRAVHAS_SMOKE_FOREIGN_DOCUMENT_ID?.trim();
if (foreignDocumentId) {
  const tenantBoundary = await fetch(`${baseUrl}/api/hr/documents/${encodeURIComponent(foreignDocumentId)}/file`, {
    headers: { cookie: sessionCookie },
    redirect: "manual",
  });
  if (tenantBoundary.status !== 404) throw new Error("TENANT_BOUNDARY_SMOKE_FAILED");
  console.log("TENANT_BOUNDARY=PASS");
} else {
  console.log("TENANT_BOUNDARY=DEFERRED_RUNTIME_VALIDATION");
}

await fetch(`${baseUrl}/api/auth/logout`, {
  method: "POST",
  headers: { cookie: sessionCookie },
  redirect: "manual",
});

console.log("POST_DEPLOY_SMOKE=PASS");
