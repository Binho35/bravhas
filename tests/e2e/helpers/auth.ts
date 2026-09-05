import { expect, type Page } from "@playwright/test";

import { e2eUsers } from "../fixtures";

export async function loginAsAlphaOwner(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Login de acesso").fill(e2eUsers.alphaOwner.login);
  await page.getByLabel("Senha").fill(e2eUsers.alphaOwner.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/$/);
}

export async function logout(page: Page) {
  await page.getByRole("button", { name: "Sair do BravHAS" }).click();
  await expect(page).toHaveURL(/\/login$/);
}
