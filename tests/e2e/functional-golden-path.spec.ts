import { expect, test } from "@playwright/test";

import { prisma } from "../../lib/prisma";
import { loginAsAlphaOwner, logout } from "./helpers/auth";

function unique(label: string) {
  return `E2E ${label} ${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;
}

test("functional golden path closes master data, employee admission, history, obligations and agenda", async ({ page }) => {
  const departmentOriginal = unique("Departamento");
  const departmentName = `${departmentOriginal} Editado`;
  const positionOriginal = unique("Cargo");
  const positionName = `${positionOriginal} Editado`;
  const employeeName = unique("Colaborador");
  const employeeEditedName = `${employeeName} Editado`;
  const cpf = `E2E-CPF-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const obligationTitle = unique("Obrigação Agenda");
  const obligationEditedTitle = `${obligationTitle} Editada`;

  await loginAsAlphaOwner(page);

  await page.goto("/rh/organizacao");
  const departmentCreateForm = page.locator("form").filter({ has: page.getByRole("button", { name: "Cadastrar departamento" }) });
  await departmentCreateForm.locator('input[name="name"]').fill(departmentOriginal);
  await departmentCreateForm.locator('input[name="code"]').fill(`E2E${Date.now().toString().slice(-5)}`);
  await departmentCreateForm.getByRole("button", { name: "Cadastrar departamento" }).click();
  await expect(page.getByText(departmentOriginal, { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Editar departamentos" }).click();
  const departmentCard = page.locator("article").filter({ hasText: departmentOriginal });
  await departmentCard.locator('input[name="name"]').fill(departmentName);
  await departmentCard.getByRole("button", { name: "Salvar departamento" }).click();
  await expect(page.getByText(departmentName, { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText(departmentName, { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Visão geral" }).click();
  const positionCreateForm = page.locator("form").filter({ has: page.getByRole("button", { name: "Cadastrar cargo" }) });
  await positionCreateForm.locator('input[name="name"]').fill(positionOriginal);
  await positionCreateForm.locator('select[name="departmentId"]').selectOption({ label: departmentName });
  await positionCreateForm.getByRole("button", { name: "Cadastrar cargo" }).click();
  await expect(page.getByText(positionOriginal, { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Editar cargos" }).click();
  const positionCard = page.locator("article").filter({ hasText: positionOriginal });
  await positionCard.locator('input[name="name"]').fill(positionName);
  await positionCard.getByRole("button", { name: "Salvar cargo" }).click();
  await expect(page.getByText(positionName, { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText(positionName, { exact: true })).toBeVisible();

  await page.goto("/rh/colaboradores/novo");
  await page.getByLabel("Nome completo *").fill(employeeName);
  await page.getByLabel("CPF *").fill(cpf);
  await page.getByLabel("Data de admissão *").fill("2026-09-15");
  await page.getByLabel("Tipo de contrato *").selectOption("CLT");
  await page.getByLabel("Departamento").selectOption({ label: departmentName });
  await page.getByLabel("Cargo").selectOption({ label: positionName });
  await page.getByRole("button", { name: /Salvar e continuar para documentos/ }).click();
  await expect(page).toHaveURL(/\/rh\/colaboradores\/[^/]+\/documentos$/);

  const employeeId = page.url().match(/\/rh\/colaboradores\/([^/]+)\/documentos$/)?.[1];
  expect(employeeId).toBeTruthy();
  const createdEmployee = await prisma.hrEmployee.findFirst({ where: { id: employeeId!, companyId: "E2E-COMPANY-ALPHA" } });
  expect(createdEmployee?.status).toBe("PRE_ADMISSION");
  expect(createdEmployee?.fullName).toBe(employeeName);
  expect(createdEmployee?.departmentId).toBeTruthy();
  expect(createdEmployee?.positionId).toBeTruthy();

  await page.locator('select[name="type"]').selectOption("DOCUMENTO_PESSOAL");
  await page.locator('input[name="title"]').fill("Documento funcional E2E");
  await page.locator('input[name="externalReference"]').fill(`external:e2e:${employeeId}`);
  await page.getByRole("button", { name: "Salvar documento" }).click();
  await expect(page.getByText("Documento funcional E2E", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Conferir" }).click();
  await expect(page.getByText("Conferido", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Ir para concluir admissão/ })).toBeVisible();

  await page.getByRole("link", { name: /Ir para concluir admissão/ }).click();
  await expect(page.getByText(employeeName, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Concluir admissão/ }).click();
  await expect(page.getByText(employeeName, { exact: true })).toHaveCount(0);

  const activeEmployee = await prisma.hrEmployee.findFirst({ where: { id: employeeId!, companyId: "E2E-COMPANY-ALPHA" } });
  expect(activeEmployee?.status).toBe("ACTIVE");
  expect(await prisma.hrAuditEvent.findFirst({ where: { companyId: "E2E-COMPANY-ALPHA", entityType: "HrEmployee", entityId: employeeId!, action: "EMPLOYEE_ADMISSION_COMPLETED" } })).toBeTruthy();

  await page.goto(`/rh/colaboradores/${employeeId}`);
  await page.getByRole("link", { name: "Editar cadastro" }).click();
  await page.getByLabel("Nome completo").fill(employeeEditedName);
  await page.getByLabel("E-mail corporativo").fill("functional.e2e@example.test");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page).toHaveURL(new RegExp(`/rh/colaboradores/${employeeId}$`));
  await expect(page.getByRole("heading", { name: employeeEditedName })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: employeeEditedName })).toBeVisible();
  expect((await prisma.hrEmployee.findUnique({ where: { id: employeeId! } }))?.emailCorporate).toBe("functional.e2e@example.test");

  await page.getByRole("link", { name: "Histórico auditável" }).click();
  await expect(page.getByText("Cadastro criado")).toBeVisible();
  await expect(page.getByText("Admissão concluída")).toBeVisible();
  await expect(page.getByText("Cadastro atualizado")).toBeVisible();
  await expect(page.getByText("Documento conferido")).toBeVisible();

  await page.goto("/obrigacoes/nova");
  await page.locator("input").nth(0).fill(obligationTitle);
  await page.locator("select").nth(0).selectOption("ADMINISTRATIVE");
  await page.locator("select").nth(1).selectOption("HIGH");
  await page.locator("input").nth(1).fill("E2E Alpha Owner");
  await page.locator("input").nth(2).fill("2026-09-20");
  await page.getByRole("button", { name: "Salvar obrigação" }).click();
  await expect(page).toHaveURL(/\/obrigacoes$/);

  const obligation = await prisma.obligation.findFirst({ where: { companyId: "E2E-COMPANY-ALPHA", title: obligationTitle } });
  expect(obligation).toBeTruthy();
  expect(await prisma.hrAuditEvent.findFirst({ where: { companyId: "E2E-COMPANY-ALPHA", entityType: "Obligation", entityId: obligation!.id, action: "OBLIGATION_CREATED" } })).toBeTruthy();

  await page.goto("/agenda");
  await expect(page.getByText(obligationTitle, { exact: true })).toBeVisible();
  await page.getByText(obligationTitle, { exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/obrigacoes/${obligation!.id}$`));

  await page.locator("input").nth(0).fill(obligationEditedTitle);
  await page.locator("select").nth(2).selectOption("IN_PROGRESS");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByText("Alterações salvas.")).toBeVisible();
  await page.reload();
  await expect(page.locator("input").nth(0)).toHaveValue(obligationEditedTitle);
  expect((await prisma.obligation.findUnique({ where: { id: obligation!.id } }))?.status).toBe("IN_PROGRESS");

  await page.goto("/agenda");
  await expect(page.getByText(obligationEditedTitle, { exact: true })).toBeVisible();
  await page.getByText(obligationEditedTitle, { exact: true }).click();
  await page.getByRole("button", { name: "Concluir", exact: true }).click();
  await expect(page).toHaveURL(/\/obrigacoes$/);
  const completed = await prisma.obligation.findUnique({ where: { id: obligation!.id } });
  expect(completed?.status).toBe("COMPLETED");
  expect(completed?.completedAt).toBeTruthy();

  await page.goto("/agenda");
  await expect(page.getByText(obligationEditedTitle, { exact: true })).toBeVisible();
  await page.goto(`/obrigacoes/${obligation!.id}/historico`);
  await expect(page.getByText("Obrigação criada")).toBeVisible();
  await expect(page.getByText("Status alterado")).toBeVisible();
  await expect(page.getByText("Obrigação concluída")).toBeVisible();

  const foreignEdit = await page.goto("/rh/colaboradores/E2E-EMP-BETA-FOREIGN/editar");
  expect(foreignEdit?.status()).toBe(404);

  await page.goto("/obrigacoes/nova");
  await page.getByRole("button", { name: "Salvar obrigação" }).click();
  await expect(page.getByText("Informe o título da obrigação.")).toBeVisible();

  await logout(page);
});
