import { createHash } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";

import { prisma } from "../../lib/prisma";

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

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

test.describe("authenticated session lifecycle", () => {
  test("direct protected URL without cookie is rejected before client auth", async ({ page }) => {
    await page.goto("/financeiro");
    await expect(page).toHaveURL(/\/login\?next=%2Ffinanceiro$/);
  });

  test("forged localStorage session cannot bypass server boundary", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "bravhas_auth_session",
        JSON.stringify({
          token: "FORGED",
          authenticated: true,
          expiresAt: "2099-01-01T00:00:00.000Z",
          createdAt: "2026-01-01T00:00:00.000Z",
          user: { active: true },
        }),
      );
    });

    await page.goto("/financeiro");
    await expect(page).toHaveURL(/\/login\?next=%2Ffinanceiro$/);
  });

  test("invalid login is rejected without creating authenticated session", async ({ page, context }) => {
    await page.goto("/login");
    await page.getByLabel("Login de acesso").fill(alpha.login);
    await page.getByLabel("Senha").fill("invalid-password-value");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByText("Login ou senha inválidos.")).toBeVisible();
    const cookies = await context.cookies();
    expect(cookies.some((cookie) => cookie.name === "bravhas_session")).toBe(false);
  });

  test("valid login creates server-backed httpOnly session", async ({ page, context }) => {
    await login(page);

    const sessionResponse = await page.request.get("/api/auth/session");
    expect(sessionResponse.ok()).toBe(true);
    const body = await sessionResponse.json();
    expect(body.authenticated).toBe(true);
    expect(String(body.session.user.loginId).toLowerCase()).toBe(alpha.login.toLowerCase());
    expect(body.session.token).toBe("SERVER_COOKIE");

    const sessionCookie = (await context.cookies()).find(
      (cookie) => cookie.name === "bravhas_session",
    );
    expect(sessionCookie).toBeTruthy();
    expect(sessionCookie?.httpOnly).toBe(true);
    expect(sessionCookie?.sameSite).toBe("Lax");
  });

  test("logout revokes session and protected navigation returns to login", async ({ page }) => {
    await login(page);
    const logoutResponse = await page.request.post("/api/auth/logout");
    expect(logoutResponse.ok()).toBe(true);

    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("invalid cookie is rejected even when proxy sees a cookie", async ({ page, context }) => {
    await context.addCookies([
      {
        name: "bravhas_session",
        value: "synthetic-invalid-cookie",
        domain: "127.0.0.1",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);

    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("revoked server session is rejected", async ({ page, context }) => {
    await login(page);
    const cookie = (await context.cookies()).find((item) => item.name === "bravhas_session");
    expect(cookie?.value).toBeTruthy();

    await prisma.userSession.update({
      where: { tokenHash: hashToken(cookie!.value) },
      data: { revokedAt: new Date() },
    });

    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("expired server session is rejected", async ({ page, context }) => {
    await login(page);
    const cookie = (await context.cookies()).find((item) => item.name === "bravhas_session");
    expect(cookie?.value).toBeTruthy();

    await prisma.userSession.update({
      where: { tokenHash: hashToken(cookie!.value) },
      data: { expiresAt: new Date(Date.now() - 60_000) },
    });

    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.afterAll(async () => {
  await prisma.$disconnect();
});
