import { expect, test, type Page } from "@playwright/test";

import { loginAsAlphaOwner, logout } from "./helpers/auth";

test.use({ viewport: { width: 1440, height: 1000 } });

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(2);
}

test.describe("desktop consolidated product smoke", () => {
  test("premium login and primary BravHAS modules remain navigable end-to-end", async ({ page }) => {
    await page.goto("/login");
    await expect(
      page.getByRole("heading", {
        name: "Controle administrativo real para financeiro, pessoas e obrigações.",
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Acesse sua operação", exact: true })).toBeVisible();
    await expect(page.getByText("Financeiro sob controle", { exact: true })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Stocco");
    await expectNoHorizontalOverflow(page);

    await loginAsAlphaOwner(page);

    await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
    await expect(
      page.getByText(
        "Acompanhe financeiro, prioridades e saúde administrativa em uma visão única para decidir com mais clareza.",
        { exact: true },
      ),
    ).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Stocco");
    await expectNoHorizontalOverflow(page);

    const modules = [
      { path: "/pessoas", heading: "RH e DP em uma única visão operacional." },
      { path: "/rh/admissoes", heading: "Admissões" },
      { path: "/documentos", heading: "Documentos" },
      { path: "/financeiro", heading: "Financeiro" },
      { path: "/financeiro/fluxo-caixa", heading: "Fluxo de Caixa" },
      { path: "/obrigacoes", heading: "Obrigações" },
      { path: "/agenda", heading: "Agenda" },
      { path: "/indicadores", heading: "Indicadores" },
    ] as const;

    for (const surface of modules) {
      await page.goto(surface.path);
      await expect(page).toHaveURL(new RegExp(`${surface.path.replaceAll("/", "\\/")}$`));
      await expect(page.getByRole("heading", { name: surface.heading, exact: true })).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }

    await logout(page);
    const sessionResponse = await page.request.get("/api/auth/session");
    expect(sessionResponse.status()).toBe(401);
  });
});
