import { expect, test, type Page } from "@playwright/test";

const fixture = {
  alpha: {
    ownerLogin: "e2eAlphaOwner",
    financialLogin: "e2eAlphaFinancial",
    hrLogin: "e2eAlphaHr",
    managerLogin: "e2eAlphaManager",
    ownerId: "E2E-USER-ALPHA-OWNER",
    branchId: "E2E-BRANCH-ALPHA",
    password: "E2E-Alpha-2026!Secure",
    accountId: "E2E-ACCOUNT-ALPHA",
  },
  beta: {
    ownerLogin: "e2eBetaOwner",
    ownerId: "E2E-USER-BETA-OWNER",
    branchId: "E2E-BRANCH-BETA",
    password: "E2E-Beta-2026!Secure",
    accountId: "E2E-ACCOUNT-BETA",
  },
} as const;

async function login(page: Page, loginId: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Login de acesso").fill(loginId);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/$/);
}

test.describe("tenant isolation and negative RBAC", () => {
  test("alpha actor can read a real alpha financial account", async ({ page }) => {
    await login(page, fixture.alpha.ownerLogin, fixture.alpha.password);
    const response = await page.request.get(`/api/financeiro/contas/${fixture.alpha.accountId}`);
    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.account.id).toBe(fixture.alpha.accountId);
  });

  test("alpha actor cannot read a valid beta account id", async ({ page }) => {
    await login(page, fixture.alpha.ownerLogin, fixture.alpha.password);
    const response = await page.request.get(`/api/financeiro/contas/${fixture.beta.accountId}`);
    expect(response.ok()).toBe(false);
    const raw = await response.text();
    expect(raw).not.toContain("E2E Beta Account");
  });

  test("alpha financial list never exposes beta account", async ({ page }) => {
    await login(page, fixture.alpha.financialLogin, fixture.alpha.password);
    const response = await page.request.get("/api/financeiro/contas");
    expect(response.ok()).toBe(true);
    const raw = await response.text();
    expect(raw).toContain(fixture.alpha.accountId);
    expect(raw).not.toContain(fixture.beta.accountId);
  });

  test("legacy financial route ignores a spoofed company filter", async ({ page }) => {
    await login(page, fixture.alpha.ownerLogin, fixture.alpha.password);
    const response = await page.request.get("/financeiro/contas?companyId=E2E-COMPANY-BETA");
    expect(response.ok()).toBe(true);
    const raw = await response.text();
    expect(raw).toContain(fixture.alpha.accountId);
    expect(raw).not.toContain(fixture.beta.accountId);
  });

  test("legacy financial route rejects a foreign branch and client actor spoofing", async ({ page }) => {
    await login(page, fixture.alpha.ownerLogin, fixture.alpha.password);
    const response = await page.request.post("/financeiro/contas", {
      data: {
        companyId: "E2E-COMPANY-BETA",
        branchId: fixture.beta.branchId,
        createdBy: fixture.beta.ownerId,
        description: "E2E legacy tenant spoofing probe",
        type: "PAYABLE",
        amount: 20,
        issueDate: "2026-10-01T12:00:00.000Z",
        dueDate: "2026-10-20T12:00:00.000Z",
      },
    });
    expect(response.ok()).toBe(false);
    const raw = await response.text();
    expect(raw).toContain("empresa autenticada");
  });

  test("beta actor can read beta resource while alpha resource stays foreign", async ({ page }) => {
    await login(page, fixture.beta.ownerLogin, fixture.beta.password);
    const own = await page.request.get(`/api/financeiro/contas/${fixture.beta.accountId}`);
    expect(own.ok()).toBe(true);
    const foreign = await page.request.get(`/api/financeiro/contas/${fixture.alpha.accountId}`);
    expect(foreign.ok()).toBe(false);
  });

  test("HR role is denied by financial server authorization", async ({ page }) => {
    await login(page, fixture.alpha.hrLogin, fixture.alpha.password);
    const response = await page.request.get(`/api/financeiro/contas/${fixture.alpha.accountId}`);
    expect(response.ok()).toBe(false);
  });

  test("scoped manager sees only self and direct reports, never foreign team or tenant", async ({ page }) => {
    await login(page, fixture.alpha.managerLogin, fixture.alpha.password);
    await page.goto("/rh/colaboradores");
    await expect(page.getByText("E2E Alpha Gestor")).toBeVisible();
    await expect(page.getByText("E2E Alpha Subordinado")).toBeVisible();
    await expect(page.getByText("E2E Alpha Fora da Equipe")).toHaveCount(0);
    await expect(page.getByText("E2E Beta Funcionário Estrangeiro")).toHaveCount(0);
  });

  test("Gestor de Setor Ponto is limited to self and direct reports", async ({ page }) => {
    await login(page, fixture.alpha.managerLogin, fixture.alpha.password);
    await page.goto("/dp/ponto");
    await expect(page).toHaveURL(/\/dp\/ponto$/);
    const employeeSelect = page.locator('select[name="employeeId"]');
    await expect(employeeSelect.locator("option")).toContainText(["Selecione", "E2E Alpha Gestor · E2E-ALPHA-MGR", "E2E Alpha Subordinado · E2E-ALPHA-REPORT"]);
    await expect(employeeSelect.locator("option", { hasText: "E2E Alpha Fora da Equipe" })).toHaveCount(0);
    await expect(employeeSelect.locator("option", { hasText: "E2E Beta Funcionário Estrangeiro" })).toHaveCount(0);
    await expect(page.getByText("E2E Alpha Fora da Equipe")).toHaveCount(0);
    await expect(page.getByText("E2E Beta Funcionário Estrangeiro")).toHaveCount(0);
  });

  test("Pessoas dashboard metrics are scoped to the authenticated tenant", async ({ page }) => {
    await login(page, fixture.alpha.ownerLogin, fixture.alpha.password);
    await page.goto("/pessoas");
    await expect(page).toHaveURL(/\/pessoas$/);
    const alphaMetric = page.locator("article").filter({ hasText: "Colaboradores ativos" });
    await expect(alphaMetric).toContainText("3");

    const logoutResponse = await page.request.post("/api/auth/logout");
    expect(logoutResponse.ok()).toBe(true);
    await login(page, fixture.beta.ownerLogin, fixture.beta.password);
    await page.goto("/pessoas");
    const betaMetric = page.locator("article").filter({ hasText: "Colaboradores ativos" });
    await expect(betaMetric).toContainText("1");
  });

  test("financial role cannot open company-wide Pessoas dashboard", async ({ page }) => {
    await login(page, fixture.alpha.financialLogin, fixture.alpha.password);
    await page.goto("/pessoas");
    await expect(page).toHaveURL(/\/$/);
  });

  test("financial create ignores client actor spoofing", async ({ page }) => {
    await login(page, fixture.alpha.ownerLogin, fixture.alpha.password);
    const response = await page.request.post("/api/financeiro/contas", {
      data: {
        description: "E2E spoofing probe",
        type: "PAYABLE",
        amount: 10.5,
        dueDate: "2026-10-10T12:00:00.000Z",
        actorId: fixture.beta.ownerId,
        createdBy: fixture.beta.ownerId,
        companyId: "E2E-COMPANY-BETA",
      },
    });
    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.account.companyId).toBe("E2E-COMPANY-ALPHA");
    expect(body.account.createdBy).toBe(fixture.alpha.ownerId);
    expect(body.account.createdBy).not.toBe(fixture.beta.ownerId);
  });

  test("obligations derive responsible actor and tenant from authenticated session", async ({ page }) => {
    await login(page, fixture.alpha.ownerLogin, fixture.alpha.password);
    const response = await page.request.post("/api/obrigacoes", {
      data: {
        title: "E2E actor spoofing obligation",
        area: "ADMINISTRATIVE",
        priority: "LOW",
        status: "PENDING",
        recurrence: "NONE",
        dueDate: "2026-10-11T12:00:00.000Z",
        responsibleName: "Synthetic Probe",
        responsibleUserId: fixture.beta.ownerId,
        createdBy: fixture.beta.ownerId,
        companyId: "E2E-COMPANY-BETA",
      },
    });
    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.obligation.companyId).toBe("E2E-COMPANY-ALPHA");
    expect(body.obligation.responsibleUserId).toBe(fixture.alpha.ownerId);
    expect(body.obligation.createdBy).toBe(fixture.alpha.ownerId);
  });

  test("beta tenant cannot read or update a valid alpha obligation id", async ({ page }) => {
    await login(page, fixture.alpha.ownerLogin, fixture.alpha.password);
    const created = await page.request.post("/api/obrigacoes", {
      data: {
        title: "E2E Alpha cross-tenant obligation",
        area: "ADMINISTRATIVE",
        priority: "MEDIUM",
        status: "PENDING",
        recurrence: "NONE",
        dueDate: "2026-10-12T12:00:00.000Z",
        responsibleName: "E2E Alpha Owner",
      },
    });
    expect(created.ok()).toBe(true);
    const createdBody = await created.json();
    const alphaObligationId = String(createdBody.obligation.id);

    const logoutResponse = await page.request.post("/api/auth/logout");
    expect(logoutResponse.ok()).toBe(true);
    await login(page, fixture.beta.ownerLogin, fixture.beta.password);

    const foreignRead = await page.request.get(`/api/obrigacoes/${alphaObligationId}`);
    expect(foreignRead.status()).toBe(404);
    const readBody = await foreignRead.json();
    expect(readBody.message).toBe("Obrigação não encontrada.");

    const foreignUpdate = await page.request.put(`/api/obrigacoes/${alphaObligationId}`, {
      data: { title: "E2E Beta attempted overwrite", status: "COMPLETED" },
    });
    expect(foreignUpdate.status()).toBe(404);
    const updateBody = await foreignUpdate.json();
    expect(updateBody.message).toBe("Obrigação não encontrada.");
  });
});
