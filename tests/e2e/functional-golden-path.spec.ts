import { expect, test, type Page } from "@playwright/test";

import { closeE2eDb, dbExec, dbMany, dbOne } from "./helpers/db";
import { loginAsAlphaOwner, logout } from "./helpers/auth";

const COMPANY_ID = "E2E-COMPANY-ALPHA";

function unique(label: string) {
  return `E2E ${label} ${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;
}

type IdRow = { id: string };
type MasterRow = { id: string; name: string; active: boolean };
type EmployeeRow = {
  id: string;
  status: string;
  fullName: string;
  departmentId: string | null;
  positionId: string | null;
  emailCorporate: string | null;
};
type ObligationRow = { id: string; status: string; completedAt: Date | null };

function toggleForm(page: Page, id: string) {
  return page.locator("form").filter({ has: page.locator(`input[name="id"][value="${id}"]`) });
}

async function auditExists(entityType: string, entityId: string, action: string) {
  return dbOne<IdRow>(
    `SELECT id FROM "HrAuditEvent" WHERE "companyId" = $1 AND "entityType" = $2 AND "entityId" = $3 AND action = $4 ORDER BY "createdAt" DESC LIMIT 1`,
    [COMPANY_ID, entityType, entityId, action],
  );
}

async function cleanupFunctionalFixture(input: {
  cpf: string;
  departmentNames: string[];
  positionNames: string[];
  obligationTitles: string[];
}) {
  const obligations = await dbMany<IdRow>(
    `SELECT id FROM "Obligation" WHERE "companyId" = $1 AND title = ANY($2::text[])`,
    [COMPANY_ID, input.obligationTitles],
  );
  const obligationIds = obligations.map((item) => item.id);
  if (obligationIds.length) {
    await dbExec(
      `DELETE FROM "HrAuditEvent" WHERE "companyId" = $1 AND "entityType" = 'Obligation' AND "entityId" = ANY($2::text[])`,
      [COMPANY_ID, obligationIds],
    );
    await dbExec(`DELETE FROM "Obligation" WHERE "companyId" = $1 AND id = ANY($2::text[])`, [COMPANY_ID, obligationIds]);
  }

  const employee = await dbOne<IdRow>(
    `SELECT id FROM "HrEmployee" WHERE "companyId" = $1 AND cpf = $2 LIMIT 1`,
    [COMPANY_ID, input.cpf],
  );
  if (employee) {
    const documents = await dbMany<IdRow>(
      `SELECT id FROM "HrEmployeeDocument" WHERE "companyId" = $1 AND "employeeId" = $2`,
      [COMPANY_ID, employee.id],
    );
    const documentIds = documents.map((item) => item.id);
    if (documentIds.length) {
      await dbExec(
        `DELETE FROM "HrAuditEvent" WHERE "companyId" = $1 AND "entityType" = 'HrEmployeeDocument' AND "entityId" = ANY($2::text[])`,
        [COMPANY_ID, documentIds],
      );
      await dbExec(
        `DELETE FROM "HrEmployeeDocument" WHERE "companyId" = $1 AND id = ANY($2::text[])`,
        [COMPANY_ID, documentIds],
      );
    }
    await dbExec(
      `DELETE FROM "HrAuditEvent" WHERE "companyId" = $1 AND "entityType" = 'HrEmployee' AND "entityId" = $2`,
      [COMPANY_ID, employee.id],
    );
    await dbExec(`DELETE FROM "HrEmployee" WHERE "companyId" = $1 AND id = $2`, [COMPANY_ID, employee.id]);
  }

  const positions = await dbMany<IdRow>(
    `SELECT id FROM "HrPosition" WHERE "companyId" = $1 AND name = ANY($2::text[])`,
    [COMPANY_ID, input.positionNames],
  );
  const positionIds = positions.map((item) => item.id);
  if (positionIds.length) {
    await dbExec(
      `DELETE FROM "HrAuditEvent" WHERE "companyId" = $1 AND "entityType" = 'HrPosition' AND "entityId" = ANY($2::text[])`,
      [COMPANY_ID, positionIds],
    );
    await dbExec(`DELETE FROM "HrPosition" WHERE "companyId" = $1 AND id = ANY($2::text[])`, [COMPANY_ID, positionIds]);
  }

  const departments = await dbMany<IdRow>(
    `SELECT id FROM "HrDepartment" WHERE "companyId" = $1 AND name = ANY($2::text[])`,
    [COMPANY_ID, input.departmentNames],
  );
  const departmentIds = departments.map((item) => item.id);
  if (departmentIds.length) {
    await dbExec(
      `DELETE FROM "HrAuditEvent" WHERE "companyId" = $1 AND "entityType" = 'HrDepartment' AND "entityId" = ANY($2::text[])`,
      [COMPANY_ID, departmentIds],
    );
    await dbExec(`DELETE FROM "HrDepartment" WHERE "companyId" = $1 AND id = ANY($2::text[])`, [COMPANY_ID, departmentIds]);
  }
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

  try {
    await loginAsAlphaOwner(page);

    await page.goto("/rh/organizacao");
    const departmentCreateForm = page.locator("form").filter({ has: page.getByRole("button", { name: "Cadastrar departamento" }) });
    await departmentCreateForm.locator('input[name="name"]').fill(departmentOriginal);
    await departmentCreateForm.locator('input[name="code"]').fill(`E2E${Date.now().toString().slice(-5)}`);
    await departmentCreateForm.getByRole("button", { name: "Cadastrar departamento" }).click();

    const department = await dbOne<MasterRow>(
      `SELECT id, name, active FROM "HrDepartment" WHERE "companyId" = $1 AND name = $2 LIMIT 1`,
      [COMPANY_ID, departmentOriginal],
    );
    expect(department).toBeTruthy();
    expect(department?.active).toBe(true);
    let departmentToggleForm = toggleForm(page, department!.id);
    await expect(departmentToggleForm.locator("..").getByText(departmentOriginal, { exact: true })).toBeVisible();
    await expect(departmentToggleForm.locator('input[name="active"]')).toHaveCount(0);
    expect(await auditExists("HrDepartment", department!.id, "DEPARTMENT_CREATED")).toBeTruthy();

    await departmentToggleForm.getByRole("button", { name: "Desativar" }).click();
    departmentToggleForm = toggleForm(page, department!.id);
    await expect(departmentToggleForm.getByRole("button", { name: "Ativar" })).toBeVisible();
    expect((await dbOne<MasterRow>(`SELECT id, name, active FROM "HrDepartment" WHERE id = $1 AND "companyId" = $2`, [department!.id, COMPANY_ID]))?.active).toBe(false);
    expect(await auditExists("HrDepartment", department!.id, "DEPARTMENT_DISABLED")).toBeTruthy();

    await departmentToggleForm.getByRole("button", { name: "Ativar" }).click();
    departmentToggleForm = toggleForm(page, department!.id);
    await expect(departmentToggleForm.locator("..").getByText(departmentOriginal, { exact: true })).toBeVisible();
    expect((await dbOne<MasterRow>(`SELECT id, name, active FROM "HrDepartment" WHERE id = $1 AND "companyId" = $2`, [department!.id, COMPANY_ID]))?.active).toBe(true);
    expect(await auditExists("HrDepartment", department!.id, "DEPARTMENT_ENABLED")).toBeTruthy();

    await page.getByRole("link", { name: "Editar departamentos" }).click();
    const departmentCard = page.locator("article").filter({ has: page.locator(`input[name="id"][value="${department!.id}"]`) });
    await departmentCard.locator('input[name="name"]').fill(departmentName);
    await departmentCard.getByRole("button", { name: "Salvar departamento" }).click();
    await expect(departmentCard.locator('input[name="name"]')).toHaveValue(departmentName);
    await page.reload();
    await expect(page.locator("article").filter({ has: page.locator(`input[name="id"][value="${department!.id}"]`) }).locator('input[name="name"]')).toHaveValue(departmentName);
    expect((await dbOne<MasterRow>(`SELECT id, name, active FROM "HrDepartment" WHERE id = $1 AND "companyId" = $2`, [department!.id, COMPANY_ID]))?.name).toBe(departmentName);

    await page.getByRole("link", { name: "Visão geral" }).click();
    const positionCreateForm = page.locator("form").filter({ has: page.getByRole("button", { name: "Cadastrar cargo" }) });
    await positionCreateForm.locator('input[name="name"]').fill(positionOriginal);
    await positionCreateForm.locator('select[name="departmentId"]').selectOption({ label: departmentName });
    await positionCreateForm.getByRole("button", { name: "Cadastrar cargo" }).click();

    const position = await dbOne<MasterRow>(
      `SELECT id, name, active FROM "HrPosition" WHERE "companyId" = $1 AND name = $2 LIMIT 1`,
      [COMPANY_ID, positionOriginal],
    );
    expect(position).toBeTruthy();
    expect(position?.active).toBe(true);
    let positionToggleForm = toggleForm(page, position!.id);
    await expect(positionToggleForm.locator("..").getByText(positionOriginal, { exact: true })).toBeVisible();
    await expect(positionToggleForm.locator('input[name="active"]')).toHaveCount(0);
    expect(await auditExists("HrPosition", position!.id, "POSITION_CREATED")).toBeTruthy();

    await positionToggleForm.getByRole("button", { name: "Desativar" }).click();
    positionToggleForm = toggleForm(page, position!.id);
    await expect(positionToggleForm.getByRole("button", { name: "Ativar" })).toBeVisible();
    expect((await dbOne<MasterRow>(`SELECT id, name, active FROM "HrPosition" WHERE id = $1 AND "companyId" = $2`, [position!.id, COMPANY_ID]))?.active).toBe(false);
    expect(await auditExists("HrPosition", position!.id, "POSITION_DISABLED")).toBeTruthy();

    await positionToggleForm.getByRole("button", { name: "Ativar" }).click();
    positionToggleForm = toggleForm(page, position!.id);
    await expect(positionToggleForm.locator("..").getByText(positionOriginal, { exact: true })).toBeVisible();
    expect((await dbOne<MasterRow>(`SELECT id, name, active FROM "HrPosition" WHERE id = $1 AND "companyId" = $2`, [position!.id, COMPANY_ID]))?.active).toBe(true);
    expect(await auditExists("HrPosition", position!.id, "POSITION_ENABLED")).toBeTruthy();

    await page.getByRole("link", { name: "Editar cargos" }).click();
    const positionCard = page.locator("article").filter({ has: page.locator(`input[name="id"][value="${position!.id}"]`) });
    await positionCard.locator('input[name="name"]').fill(positionName);
    await positionCard.getByRole("button", { name: "Salvar cargo" }).click();
    await expect(positionCard.locator('input[name="name"]')).toHaveValue(positionName);
    await page.reload();
    await expect(page.locator("article").filter({ has: page.locator(`input[name="id"][value="${position!.id}"]`) }).locator('input[name="name"]')).toHaveValue(positionName);
    expect((await dbOne<MasterRow>(`SELECT id, name, active FROM "HrPosition" WHERE id = $1 AND "companyId" = $2`, [position!.id, COMPANY_ID]))?.name).toBe(positionName);

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
    const createdEmployee = await dbOne<EmployeeRow>(
      `SELECT id, status, "fullName", "departmentId", "positionId", "emailCorporate" FROM "HrEmployee" WHERE id = $1 AND "companyId" = $2`,
      [employeeId!, COMPANY_ID],
    );
    expect(createdEmployee?.status).toBe("PRE_ADMISSION");
    expect(createdEmployee?.fullName).toBe(employeeName);
    expect(createdEmployee?.departmentId).toBe(department!.id);
    expect(createdEmployee?.positionId).toBe(position!.id);

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

    const activeEmployee = await dbOne<EmployeeRow>(
      `SELECT id, status, "fullName", "departmentId", "positionId", "emailCorporate" FROM "HrEmployee" WHERE id = $1 AND "companyId" = $2`,
      [employeeId!, COMPANY_ID],
    );
    expect(activeEmployee?.status).toBe("ACTIVE");
    expect(await auditExists("HrEmployee", employeeId!, "EMPLOYEE_ADMISSION_COMPLETED")).toBeTruthy();

    await page.goto(`/rh/colaboradores/${employeeId}`);
    await page.getByRole("link", { name: "Editar cadastro" }).click();
    await page.getByLabel("Nome completo").fill(employeeEditedName);
    await page.getByLabel("E-mail corporativo").fill("functional.e2e@example.test");
    await page.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(page).toHaveURL(new RegExp(`/rh/colaboradores/${employeeId}$`));
    await expect(page.getByRole("heading", { name: employeeEditedName })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { name: employeeEditedName })).toBeVisible();
    expect((await dbOne<EmployeeRow>(
      `SELECT id, status, "fullName", "departmentId", "positionId", "emailCorporate" FROM "HrEmployee" WHERE id = $1 AND "companyId" = $2`,
      [employeeId!, COMPANY_ID],
    ))?.emailCorporate).toBe("functional.e2e@example.test");

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

    const obligation = await dbOne<ObligationRow>(
      `SELECT id, status, "completedAt" FROM "Obligation" WHERE "companyId" = $1 AND title = $2 LIMIT 1`,
      [COMPANY_ID, obligationTitle],
    );
    expect(obligation).toBeTruthy();
    expect(await auditExists("Obligation", obligation!.id, "OBLIGATION_CREATED")).toBeTruthy();

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
    expect((await dbOne<ObligationRow>(`SELECT id, status, "completedAt" FROM "Obligation" WHERE id = $1 AND "companyId" = $2`, [obligation!.id, COMPANY_ID]))?.status).toBe("IN_PROGRESS");

    await page.goto("/agenda");
    await expect(page.getByText(obligationEditedTitle, { exact: true })).toBeVisible();
    await page.getByText(obligationEditedTitle, { exact: true }).click();
    await page.getByRole("button", { name: "Concluir", exact: true }).click();
    await expect(page).toHaveURL(/\/obrigacoes$/);
    const completed = await dbOne<ObligationRow>(
      `SELECT id, status, "completedAt" FROM "Obligation" WHERE id = $1 AND "companyId" = $2`,
      [obligation!.id, COMPANY_ID],
    );
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
  } finally {
    await cleanupFunctionalFixture({
      cpf,
      departmentNames: [departmentOriginal, departmentName],
      positionNames: [positionOriginal, positionName],
      obligationTitles: [obligationTitle, obligationEditedTitle],
    });
    await closeE2eDb();
  }
});
