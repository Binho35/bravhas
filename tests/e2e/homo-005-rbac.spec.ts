import { expect, test, type Page } from "@playwright/test";

import { e2eUsers } from "./fixtures";
import { closeE2eDb, dbOne } from "./helpers/db";

const COMPANY_ID = "E2E-COMPANY-ALPHA";
const SAFE_DENIAL_STATUSES = [200, 302, 303, 307, 308, 403, 404] as const;

type CountRow = { count: number };
type EmployeeRow = { id: string; fullName: string };

async function login(page: Page, loginId: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Login de acesso").fill(loginId);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/$/);
}

async function switchSessionByApi(page: Page, loginId: string, password: string) {
  const response = await page.request.post("/api/auth/login", { data: { loginId, password } });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.success).toBe(true);
}

async function expectAllowed(page: Page, path: string) {
  const response = await page.goto(path);
  expect(response?.status()).toBe(200);
  await expect(page).toHaveURL(new RegExp(`${path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));
}

async function expectVisualDenied(page: Page, path: string, protectedText: string | RegExp) {
  const response = await page.goto(path);
  const status = response?.status() ?? 0;
  console.log(`RBAC_DENY_ROUTE path=${path} status=${status}`);
  expect(SAFE_DENIAL_STATUSES).toContain(status);
  await expect(page.getByText(protectedText, { exact: typeof protectedText === "string" })).toHaveCount(0);
}

async function expectFinancialApiDenied(page: Page, label: string) {
  const list = await page.request.get("/api/financeiro/contas");
  console.log(`RBAC_DENY_API role=${label} method=GET path=/api/financeiro/contas status=${list.status()}`);
  expect(list.status()).toBe(403);
  const listBody = await list.json();
  expect(listBody.success).toBe(false);
  expect(listBody.accounts).toBeUndefined();

  const description = `HOMO005 RBAC DENY ${label} ${Date.now()}`;
  const create = await page.request.post("/api/financeiro/contas", {
    data: {
      description,
      type: "PAYABLE",
      amount: 10.25,
      issueDate: "2026-09-09T12:00:00.000Z",
      dueDate: "2026-09-30T12:00:00.000Z",
    },
  });
  console.log(`RBAC_DENY_API role=${label} method=POST path=/api/financeiro/contas status=${create.status()}`);
  expect(create.status()).toBe(403);
  const createBody = await create.json();
  expect(createBody.success).toBe(false);
  expect(createBody.account).toBeUndefined();

  const persisted = await dbOne<CountRow>(
    `SELECT COUNT(*)::int AS count FROM "FinancialAccount" WHERE "companyId" = $1 AND description = $2`,
    [COMPANY_ID, description],
  );
  console.log(`RBAC_DENY_MUTATION role=${label} resource=FinancialAccount persisted=${persisted?.count ?? 0}`);
  expect(persisted?.count ?? 0).toBe(0);
}

test.describe("HOMO-005 departmental RBAC", () => {
  test.afterEach(async () => {
    await closeE2eDb();
  });

  test("FINANCIAL is restricted to Financeiro", async ({ page }) => {
    await login(page, e2eUsers.alphaFinancial.login, e2eUsers.alphaFinancial.password);
    await expectAllowed(page, "/financeiro");
    await expect(page.locator('a[href="/financeiro"]')).toBeVisible();
    await expect(page.locator('a[href^="/rh"]')).toHaveCount(0);
    await expect(page.locator('a[href^="/dp"]')).toHaveCount(0);
    await expectVisualDenied(page, "/rh", "Gestão de pessoas, desenvolvimento, comunicação e experiência do colaborador.");
    await expectVisualDenied(page, "/dp", "Rotinas trabalhistas, jornada, benefícios, afastamentos e fechamento operacional.");
  });

  test("HR is restricted to RH and Financeiro fails closed without data or mutation", async ({ page }) => {
    await login(page, e2eUsers.alphaHr.login, e2eUsers.alphaHr.password);
    await expectAllowed(page, "/rh");
    await expect(page.locator('a[href^="/rh"]')).not.toHaveCount(0);
    await expect(page.locator('a[href^="/dp"]')).toHaveCount(0);
    await expectVisualDenied(page, "/dp", "Rotinas trabalhistas, jornada, benefícios, afastamentos e fechamento operacional.");
    await expectVisualDenied(page, "/financeiro", "Movimentações financeiras");
    await expectFinancialApiDenied(page, "HR");
  });

  test("PAYROLL is restricted to DP and Financeiro fails closed without data or mutation", async ({ page }) => {
    await login(page, e2eUsers.alphaPayroll.login, e2eUsers.alphaPayroll.password);
    await expectAllowed(page, "/dp");
    await expect(page.locator('a[href^="/dp"]')).not.toHaveCount(0);
    await expect(page.locator('a[href^="/rh"]')).toHaveCount(0);
    await expectVisualDenied(page, "/rh", "Gestão de pessoas, desenvolvimento, comunicação e experiência do colaborador.");
    await expectVisualDenied(page, "/financeiro", "Movimentações financeiras");
    await expectFinancialApiDenied(page, "PAYROLL");
  });

  test("OWNER has global Financeiro, RH and DP access and historical DP route redirects", async ({ page }) => {
    await login(page, e2eUsers.alphaOwner.login, e2eUsers.alphaOwner.password);
    await expectAllowed(page, "/financeiro");
    await expectAllowed(page, "/rh");
    await expect(page.locator('a[href^="/rh"]')).not.toHaveCount(0);
    await expect(page.locator('a[href^="/dp"]')).not.toHaveCount(0);
    await expect(page.getByRole("link", { name: "Voltar ao Centro de Controle" })).toBeVisible();
    await expectAllowed(page, "/dp");
    await page.goto("/departamento-pessoal");
    await expect(page).toHaveURL(/\/dp$/);
  });

  test("ADMIN uses the existing global bypass without a new role", async ({ page }) => {
    await login(page, e2eUsers.alphaAdmin.login, e2eUsers.alphaAdmin.password);
    await expectAllowed(page, "/financeiro");
    await expectAllowed(page, "/rh");
    await expectAllowed(page, "/dp");
  });

  test("OPERATIONAL without Férias permission gets safe visual denial and cannot mutate through a stale authorized form", async ({ page }) => {
    const employee = await dbOne<EmployeeRow>(
      `SELECT id, "fullName" FROM "HrEmployee" WHERE "companyId" = $1 AND status = 'ACTIVE' AND active = true ORDER BY id LIMIT 1`,
      [COMPANY_ID],
    );
    expect(employee).toBeTruthy();

    await login(page, e2eUsers.alphaOwner.login, e2eUsers.alphaOwner.password);
    await expectAllowed(page, "/dp/ferias");
    await page.locator('select[name="employeeId"]').selectOption(employee!.id);
    await page.locator('input[name="startDate"]').fill("2027-03-01");
    await page.locator('input[name="endDate"]').fill("2027-03-10");

    await switchSessionByApi(page, e2eUsers.alphaManager.login, e2eUsers.alphaManager.password);
    const actionResponsePromise = page.waitForResponse((response) => {
      const url = new URL(response.url());
      return response.request().method() === "POST" && url.pathname === "/dp/ferias";
    });
    await page.getByRole("button", { name: "Registrar programação" }).click();
    const actionResponse = await actionResponsePromise;
    console.log(`RBAC_DENY_SERVER_ACTION role=OPERATIONAL path=/dp/ferias status=${actionResponse.status()}`);
    expect(SAFE_DENIAL_STATUSES).toContain(actionResponse.status());

    const mutated = await dbOne<CountRow>(
      `SELECT COUNT(*)::int AS count FROM "HrVacationRequest" WHERE "companyId" = $1 AND "employeeId" = $2 AND "startDate" = $3::timestamp`,
      [COMPANY_ID, employee!.id, "2027-03-01T12:00:00.000Z"],
    );
    console.log(`RBAC_DENY_MUTATION role=OPERATIONAL resource=HrVacationRequest persisted=${mutated?.count ?? 0}`);
    expect(mutated?.count ?? 0).toBe(0);

    await expectVisualDenied(page, "/dp/ferias", "Programar férias");
    await expect(page.getByText(employee!.fullName, { exact: true })).toHaveCount(0);
    await expectVisualDenied(page, "/rh/admissoes", /Admiss/);
    await expectVisualDenied(page, "/financeiro", "Movimentações financeiras");
  });
});
