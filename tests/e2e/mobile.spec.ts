import { expect, test, type Page } from "@playwright/test";

const alpha = {
  login: "e2eAlphaOwner",
  password: "E2E-Alpha-2026!Secure",
};

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Login de acesso").fill(alpha.login);
  await page.getByLabel("Senha").fill(alpha.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/$/);
}

async function expectNoSevereHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
}

test.describe("mobile product smoke", () => {
  test("login, dashboard and mobile navigation remain usable without horizontal overflow", async ({ page }) => {
    await login(page);
    await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Abrir menu de navegação" })).toBeVisible();
    await expectNoSevereHorizontalOverflow(page);

    await page.getByRole("button", { name: "Abrir menu de navegação" }).click();
    await expect(page.getByRole("dialog", { name: "Navegação principal" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Obrigações", exact: true })).toBeVisible();

    await page.getByRole("link", { name: "Obrigações", exact: true }).click();
    await expect(page).toHaveURL(/\/obrigacoes$/);
    await expect(page.getByRole("heading", { name: "Obrigações", exact: true })).toBeVisible();
    await expectNoSevereHorizontalOverflow(page);
  });

  test("financial and cash-flow mobile surfaces use session-scoped APIs and remain navigable", async ({ page }) => {
    await login(page);
    await page.goto("/financeiro");
    await expect(page.getByRole("heading", { name: "Financeiro", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Fluxo de Caixa", exact: true })).toBeVisible();
    await expectNoSevereHorizontalOverflow(page);

    await page.getByRole("link", { name: "Fluxo de Caixa", exact: true }).click();
    await expect(page).toHaveURL(/\/financeiro\/fluxo-caixa$/);
    await expect(page.getByRole("heading", { name: "Fluxo de Caixa", exact: true })).toBeVisible();
    await expect(page.getByLabel("Saldo inicial", { exact: true })).toBeVisible();
    await expectNoSevereHorizontalOverflow(page);
  });

  test("mobile drawer closes with Escape and logout completes safely", async ({ page }) => {
    await login(page);
    const menuButton = page.getByRole("button", { name: "Abrir menu de navegação" });
    await menuButton.click();
    await expect(page.getByRole("dialog", { name: "Navegação principal" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Navegação principal" })).toBeHidden();

    await page.getByRole("button", { name: "Sair do BravHAS" }).click();
    await expect(page).toHaveURL(/\/login$/);

    const sessionResponse = await page.request.get("/api/auth/session");
    expect(sessionResponse.status()).toBe(401);
  });
});
