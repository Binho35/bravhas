import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { roleAllowsHrdpDepartment, roleAllowsHrdpResource } from "../../modules/auth/server/rbac";
import { hasPermission } from "../../modules/auth/services/hasPermission";
import { shouldTouchSession, SESSION_TOUCH_INTERVAL_MS } from "../../modules/auth/server/sessionPolicy";
import type { AuthUser, AuthUserRole } from "../../modules/auth/types/AuthUser";

function user(role: AuthUserRole): AuthUser {
  return {
    id: `USER-${role}`,
    companyId: "COMPANY-TEST",
    branchId: "BRANCH-TEST",
    companyPrefix: "test",
    username: role,
    loginId: role.toLowerCase(),
    name: role,
    email: `${role.toLowerCase()}@example.test`,
    role,
    active: true,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  };
}

test("department roles are segregated while OWNER/ADMIN remain global", () => {
  assert.equal(roleAllowsHrdpDepartment("OWNER", "RH"), true);
  assert.equal(roleAllowsHrdpDepartment("OWNER", "DP"), true);
  assert.equal(roleAllowsHrdpDepartment("ADMIN", "RH"), true);
  assert.equal(roleAllowsHrdpDepartment("ADMIN", "DP"), true);
  assert.equal(roleAllowsHrdpDepartment("FINANCIAL", "RH"), false);
  assert.equal(roleAllowsHrdpDepartment("FINANCIAL", "DP"), false);
  assert.equal(roleAllowsHrdpDepartment("HR", "RH"), true);
  assert.equal(roleAllowsHrdpDepartment("HR", "DP"), false);
  assert.equal(roleAllowsHrdpDepartment("PAYROLL", "RH"), false);
  assert.equal(roleAllowsHrdpDepartment("PAYROLL", "DP"), true);
});

test("server resource policy blocks HR/DP cross-department access", () => {
  assert.equal(roleAllowsHrdpResource("HR", "colaboradores"), true);
  assert.equal(roleAllowsHrdpResource("HR", "ferias"), false);
  assert.equal(roleAllowsHrdpResource("PAYROLL", "ferias"), true);
  assert.equal(roleAllowsHrdpResource("PAYROLL", "admissoes"), false);
  assert.equal(roleAllowsHrdpResource("FINANCIAL", "colaboradores"), false);
  assert.equal(roleAllowsHrdpResource("FINANCIAL", "folha"), false);
});

test("client permission matrix matches Financeiro, RH and DP segregation", () => {
  assert.equal(hasPermission({ user: user("FINANCIAL"), resource: "FINANCIAL", action: "VIEW" }), true);
  assert.equal(hasPermission({ user: user("FINANCIAL"), resource: "PEOPLE", action: "VIEW" }), false);
  assert.equal(hasPermission({ user: user("FINANCIAL"), resource: "PAYROLL", action: "VIEW" }), false);

  assert.equal(hasPermission({ user: user("HR"), resource: "PEOPLE", action: "VIEW" }), true);
  assert.equal(hasPermission({ user: user("HR"), resource: "PAYROLL", action: "VIEW" }), false);
  assert.equal(hasPermission({ user: user("HR"), resource: "FINANCIAL", action: "VIEW" }), false);

  assert.equal(hasPermission({ user: user("PAYROLL"), resource: "PAYROLL", action: "VIEW" }), true);
  assert.equal(hasPermission({ user: user("PAYROLL"), resource: "PEOPLE", action: "VIEW" }), false);
  assert.equal(hasPermission({ user: user("PAYROLL"), resource: "FINANCIAL", action: "VIEW" }), false);

  assert.equal(hasPermission({ user: user("OWNER"), resource: "FINANCIAL", action: "VIEW" }), true);
  assert.equal(hasPermission({ user: user("OWNER"), resource: "PEOPLE", action: "VIEW" }), true);
  assert.equal(hasPermission({ user: user("OWNER"), resource: "PAYROLL", action: "VIEW" }), true);
});

test("session lastSeen write is throttled independently from session validation", () => {
  const now = new Date("2026-09-08T12:00:00.000Z");
  assert.equal(shouldTouchSession(new Date(now.getTime() - SESSION_TOUCH_INTERVAL_MS + 1), now), false);
  assert.equal(shouldTouchSession(new Date(now.getTime() - SESSION_TOUCH_INTERVAL_MS), now), true);
});

test("client shell has one session fetch source through AuthProvider", async () => {
  const provider = await readFile("modules/auth/components/AuthProvider.tsx", "utf8");
  assert.match(provider, /getCurrentSession/);

  for (const path of [
    "modules/auth/hooks/useAuth.ts",
    "modules/auth/hooks/usePermission.ts",
    "modules/auth/components/AuthGuard.tsx",
    "modules/auth/components/PermissionGuard.tsx",
    "components/layout/Sidebar.tsx",
    "components/layout/Header.tsx",
  ]) {
    const source = await readFile(path, "utf8");
    assert.doesNotMatch(source, /getCurrentSession/);
  }

  const hook = await readFile("modules/auth/hooks/useAuth.ts", "utf8");
  assert.match(hook, /useSharedAuth/);
});
