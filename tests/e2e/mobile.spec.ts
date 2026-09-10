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

async function loginThroughApi(page: Page) {
  const response = await page.request.post("/api/auth/login", {
    data: {
      loginId: alpha.login,
      password: alpha.password,
    },
  });
  expect(response.ok()).toBe(true);
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

  test("session request fan-out stays at one request per mobile route transition", async ({ page }) => {
    await loginThroughApi(page);

    let phase: "initial" | "navigation" = "initial";
    let initialSessionRequests = 0;
    let navigationSessionRequests = 0;

    page.on("request", (request) => {
      const url = new URL(request.url());
      if (request.method() !== "GET" || url.pathname !== "/api/auth/session") return;
      if (phase === "initial") initialSessionRequests += 1;
      else navigationSessionRequests += 1;
    });

    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
    await page.waitForTimeout(500);

    phase = "navigation";
    await page.getByRole("button", { name: "Abrir menu de navegação" }).click();
    await page.getByRole("link", { name: "Obrigações", exact: true }).click();
    await expect(page).toHaveURL(/\/obrigacoes$/);
    await expect(page.getByRole("heading", { name: "Obrigações", exact: true })).toBeVisible();
    await page.waitForTimeout(500);

    console.log(`PERF_SESSION_MOBILE_INITIAL_REQUESTS=${initialSessionRequests}`);
    console.log(`PERF_SESSION_MOBILE_NAVIGATION_REQUESTS=${navigationSessionRequests}`);
    console.log(`PERF_SESSION_MOBILE_TOTAL_REQUESTS=${initialSessionRequests + navigationSessionRequests}`);

    expect(initialSessionRequests).toBe(1);
    expect(navigationSessionRequests).toBe(1);
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

  test("Pessoas shell exposes RH and DP navigation on mobile", async ({ page }) => {
    await login(page);
    await page.goto("/pessoas");
    await expect(page.getByRole("heading", { name: "RH e DP em uma única visão operacional.", exact: true })).toBeVisible();
    await expectNoSevereHorizontalOverflow(page);

    await page.getByRole("button", { name: "Abrir navegação de Pessoas" }).click();
    const drawer = page.getByRole("dialog", { name: "Navegação de RH e Departamento Pessoal" });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole("link", { name: "RH", exact: true })).toBeVisible();
    await expect(drawer.getByRole("link", { name: "DP", exact: true })).toBeVisible();

    await drawer.getByRole("link", { name: "RH", exact: true }).click();
    await expect(page).toHaveURL(/\/rh$/);
    await expect(page.getByRole("heading", { name: "RH", exact: true })).toBeVisible();
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
