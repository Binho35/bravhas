import { expect, test } from "@playwright/test";

import { loginAsAlphaOwner, logout } from "./helpers/auth";

test.describe("desktop consolidated product smoke", () => {
  test("login and primary BravHAS modules remain navigable end-to-end", async ({ page }) => {
    await loginAsAlphaOwner(page);

    await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();

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
    }

    await logout(page);
    const sessionResponse = await page.request.get("/api/auth/session");
    expect(sessionResponse.status()).toBe(401);
  });
});
