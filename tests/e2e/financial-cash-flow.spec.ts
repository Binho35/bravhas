import { expect, test, type Page } from "@playwright/test";

const fixture = {
  alpha: { login: "e2eAlphaOwner", password: "E2E-Alpha-2026!Secure" },
  beta: { login: "e2eBetaOwner", password: "E2E-Beta-2026!Secure" },
} as const;

async function login(page: Page, loginId: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Login de acesso").fill(loginId);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/$/);
}

test.describe("cash-flow opening balance", () => {
  test("persists opening balance across refresh and isolates tenants", async ({ page }) => {
    await login(page, fixture.alpha.login, fixture.alpha.password);

    const alphaWrite = await page.request.put("/api/financeiro/fluxo-caixa", {
      data: { amount: 1234.56, asOfDate: "2026-09-05" },
    });
    expect(alphaWrite.ok()).toBe(true);
    const alphaWriteBody = await alphaWrite.json();
    expect(alphaWriteBody.openingBalance.amount).toBe(1234.56);
    expect(alphaWriteBody.openingBalance.asOfDate).toBe("2026-09-05");

    await page.goto("/financeiro/fluxo-caixa");
    await expect(page.getByLabel("Saldo inicial")).toHaveValue("1.234,56");
    await expect(page.getByLabel("Data-base")).toHaveValue("2026-09-05");
    await page.reload();
    await expect(page.getByLabel("Saldo inicial")).toHaveValue("1.234,56");

    const logoutAlpha = await page.request.post("/api/auth/logout");
    expect(logoutAlpha.ok()).toBe(true);
    await login(page, fixture.beta.login, fixture.beta.password);

    const betaInitial = await page.request.get("/api/financeiro/fluxo-caixa");
    expect(betaInitial.ok()).toBe(true);
    const betaInitialBody = await betaInitial.json();
    expect(betaInitialBody.openingBalance?.amount ?? 0).not.toBe(1234.56);

    const betaWrite = await page.request.put("/api/financeiro/fluxo-caixa", {
      data: { amount: 98.76, asOfDate: "2026-09-05" },
    });
    expect(betaWrite.ok()).toBe(true);

    const logoutBeta = await page.request.post("/api/auth/logout");
    expect(logoutBeta.ok()).toBe(true);
    await login(page, fixture.alpha.login, fixture.alpha.password);

    const alphaRead = await page.request.get("/api/financeiro/fluxo-caixa");
    expect(alphaRead.ok()).toBe(true);
    const alphaReadBody = await alphaRead.json();
    expect(alphaReadBody.openingBalance.amount).toBe(1234.56);
    expect(alphaReadBody.openingBalance.asOfDate).toBe("2026-09-05");
  });
});
