import { expect, test, type Page } from "@playwright/test";

import { e2eUsers } from "./fixtures";

async function login(page: Page, loginId: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Login de acesso").fill(loginId);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/$/);
}

async function expectAllowed(page: Page, path: string) {
  const response = await page.goto(path);
  expect(response?.status()).toBe(200);
  await expect(page).toHaveURL(new RegExp(`${path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));
}

async function expectDenied(page: Page, path: string) {
  const response = await page.request.get(path);
  expect(response.ok()).toBe(false);
}

test.describe("HOMO-005 departmental RBAC", () => {
  test("FINANCIAL is restricted to Financeiro", async ({ page }) => {
    await login(page, e2eUsers.alphaFinancial.login, e2eUsers.alphaFinancial.password);
    await expectAllowed(page, "/financeiro");
    await expect(page.locator('a[href="/financeiro"]')).toBeVisible();
    await expect(page.locator('a[href^="/rh"]')).toHaveCount(0);
    await expect(page.locator('a[href^="/dp"]')).toHaveCount(0);
    await expectDenied(page, "/rh");
    await expectDenied(page, "/dp");
  });

  test("HR is restricted to RH", async ({ page }) => {
    await login(page, e2eUsers.alphaHr.login, e2eUsers.alphaHr.password);
    await expectAllowed(page, "/rh");
    await expect(page.locator('a[href^="/rh"]')).not.toHaveCount(0);
    await expect(page.locator('a[href^="/dp"]')).toHaveCount(0);
    await expectDenied(page, "/dp");
    await expectDenied(page, "/financeiro");
  });

  test("PAYROLL is restricted to DP", async ({ page }) => {
    await login(page, e2eUsers.alphaPayroll.login, e2eUsers.alphaPayroll.password);
    await expectAllowed(page, "/dp");
    await expect(page.locator('a[href^="/dp"]')).not.toHaveCount(0);
    await expect(page.locator('a[href^="/rh"]')).toHaveCount(0);
    await expectDenied(page, "/rh");
    await expectDenied(page, "/financeiro");
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

  test("OPERATIONAL only crosses department boundaries through its AccessProfile", async ({ page }) => {
    await login(page, e2eUsers.alphaManager.login, e2eUsers.alphaManager.password);
    await expectAllowed(page, "/rh/colaboradores");
    await expectAllowed(page, "/dp/ponto");
    await expectDenied(page, "/dp/ferias");
    await expectDenied(page, "/rh/admissoes");
    await expectDenied(page, "/financeiro");
  });
});
