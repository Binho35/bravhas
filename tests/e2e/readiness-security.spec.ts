import { expect, test } from "@playwright/test";

import { loginAsAlphaOwner } from "./helpers/auth";
import { e2eUsers } from "./fixtures";

const beta = {
  employeeId: "E2E-EMP-BETA-FOREIGN",
  documentId: "E2E-DOC-BETA-FOREIGN",
  obligationId: "E2E-OBLIGATION-BETA-FOREIGN",
} as const;

async function loginAsBetaOwner(page: Parameters<typeof loginAsAlphaOwner>[0]) {
  await page.goto("/login");
  await page.getByLabel("Login de acesso").fill(e2eUsers.betaOwner.login);
  await page.getByLabel("Senha").fill(e2eUsers.betaOwner.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/$/);
}

test.describe("readiness cross-tenant regression", () => {
  test("alpha cannot open a valid beta employee dossier", async ({ page }) => {
    await loginAsAlphaOwner(page);
    const response = await page.request.get(`/rh/colaboradores/${beta.employeeId}`);
    expect(response.status()).toBe(404);
    expect(await response.text()).not.toContain("E2E Beta Funcionário Estrangeiro");
  });

  test("alpha cannot open a valid beta document file route", async ({ page }) => {
    await loginAsAlphaOwner(page);
    const response = await page.request.get(`/api/hr/documents/${beta.documentId}/file`);
    expect(response.status()).toBe(404);
    expect(await response.text()).not.toContain("E2E Beta Documento Estrangeiro");
  });

  test("alpha cannot read or update a valid beta obligation", async ({ page }) => {
    await loginAsAlphaOwner(page);

    const read = await page.request.get(`/api/obrigacoes/${beta.obligationId}`);
    expect(read.status()).toBe(404);

    const update = await page.request.put(`/api/obrigacoes/${beta.obligationId}`, {
      data: { status: "COMPLETED", title: "foreign overwrite probe" },
    });
    expect(update.status()).toBe(404);
  });

  test("indicators remain scoped when switching from alpha to beta", async ({ page }) => {
    await loginAsAlphaOwner(page);
    const alphaResponse = await page.request.get("/api/indicadores");
    expect(alphaResponse.ok()).toBe(true);
    const alpha = await alphaResponse.json();
    expect(alpha.people.activeEmployees).toBe(3);

    const logout = await page.request.post("/api/auth/logout");
    expect(logout.ok()).toBe(true);

    await loginAsBetaOwner(page);
    const betaResponse = await page.request.get("/api/indicadores");
    expect(betaResponse.ok()).toBe(true);
    const betaIndicators = await betaResponse.json();
    expect(betaIndicators.people.activeEmployees).toBe(1);
    expect(betaIndicators.people.activeEmployees).not.toBe(alpha.people.activeEmployees);
  });
});
