import { expect, test, type Page } from "@playwright/test";

import { closeE2eDb, dbExec, dbMany, dbOne } from "./helpers/db";
import { loginAsAlphaOwner } from "./helpers/auth";

const COMPANY_ID = "E2E-COMPANY-ALPHA";
const BRANCH_ID = "E2E-BRANCH-ALPHA";
const REAL_DOCUMENT_FIXTURE = "tests/fixtures/homo-005-document.pdf";

type IdRow = { id: string };
type EmployeeRow = { id: string; cpf: string | null; status: string; active: boolean };
type DocumentRow = { id: string; storageKey: string | null; verifiedAt: Date | null };

function unique(label: string) {
  return `HOMO005 ${label} ${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;
}

async function fillMinimumAdmission(page: Page, input: { fullName: string; cpf: string }) {
  await page.goto("/rh/colaboradores/novo");
  await page.locator('input[name="fullName"]').fill(input.fullName);
  await page.locator('input[name="cpf"]').fill(input.cpf);
  await page.locator('input[name="hireDate"]').fill("2026-09-15");
  await page.locator('select[name="employmentType"]').selectOption("CLT");
}

async function injectEmployeeSelection(page: Page, employeeId: string) {
  await page.locator('select[name="employeeId"]').evaluate((element, value) => {
    const select = element as HTMLSelectElement;
    const option = document.createElement("option");
    option.value = value;
    option.textContent = "HOMO-005 manipulated employee";
    select.appendChild(option);
    select.value = value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }, employeeId);
}

async function cleanupEmployee(employeeId: string | null) {
  if (!employeeId) return;
  const documents = await dbMany<IdRow>(`SELECT id FROM "HrEmployeeDocument" WHERE "companyId" = $1 AND "employeeId" = $2`, [COMPANY_ID, employeeId]);
  const vacations = await dbMany<IdRow>(`SELECT id FROM "HrVacationRequest" WHERE "companyId" = $1 AND "employeeId" = $2`, [COMPANY_ID, employeeId]);
  const occurrences = await dbMany<IdRow>(`SELECT id FROM "HrTimeOccurrence" WHERE "companyId" = $1 AND "employeeId" = $2`, [COMPANY_ID, employeeId]);
  const disciplinary = await dbMany<IdRow>(`SELECT id FROM "HrDisciplinaryAction" WHERE "companyId" = $1 AND "employeeId" = $2`, [COMPANY_ID, employeeId]);
  const entityIds = [employeeId, ...documents, ...vacations, ...occurrences, ...disciplinary].map((item) => typeof item === "string" ? item : item.id);

  await dbExec(`DELETE FROM "HrAuditEvent" WHERE "companyId" = $1 AND "entityId" = ANY($2::text[])`, [COMPANY_ID, entityIds]);
  await dbExec(`DELETE FROM "HrDisciplinaryAction" WHERE "companyId" = $1 AND "employeeId" = $2`, [COMPANY_ID, employeeId]);
  await dbExec(`DELETE FROM "HrTimeOccurrence" WHERE "companyId" = $1 AND "employeeId" = $2`, [COMPANY_ID, employeeId]);
  await dbExec(`DELETE FROM "HrVacationRequest" WHERE "companyId" = $1 AND "employeeId" = $2`, [COMPANY_ID, employeeId]);
  await dbExec(`DELETE FROM "HrBenefitEnrollment" WHERE "companyId" = $1 AND "employeeId" = $2`, [COMPANY_ID, employeeId]);
  await dbExec(`DELETE FROM "HrEmployeeDocument" WHERE "companyId" = $1 AND "employeeId" = $2`, [COMPANY_ID, employeeId]);
  await dbExec(`DELETE FROM "HrEmployee" WHERE "companyId" = $1 AND id = $2`, [COMPANY_ID, employeeId]);
}

test.describe.serial("HOMO-005 human golden path", () => {
  test("CPF semantic rules, required admission fields and legacy duplicate fail closed", async ({ page }) => {
    const repeatedName = unique("CPF repetido");
    const checkDigitName = unique("CPF dígito inválido");
    const missingHireName = unique("Sem admissão");
    const missingEmploymentName = unique("Sem contrato");
    const duplicateName = unique("CPF duplicado");
    const historicalId = `HOMO005-HIST-${Date.now()}`;

    try {
      await loginAsAlphaOwner(page);

      await fillMinimumAdmission(page, { fullName: repeatedName, cpf: "000.000.000-00" });
      await page.getByRole("button", { name: /Salvar e continuar para documentos/ }).click().catch(() => undefined);
      expect(await dbOne<IdRow>(`SELECT id FROM "HrEmployee" WHERE "companyId" = $1 AND "fullName" = $2`, [COMPANY_ID, repeatedName])).toBeNull();

      await fillMinimumAdmission(page, { fullName: checkDigitName, cpf: "529.982.247-24" });
      await page.getByRole("button", { name: /Salvar e continuar para documentos/ }).click().catch(() => undefined);
      expect(await dbOne<IdRow>(`SELECT id FROM "HrEmployee" WHERE "companyId" = $1 AND "fullName" = $2`, [COMPANY_ID, checkDigitName])).toBeNull();

      await fillMinimumAdmission(page, { fullName: missingHireName, cpf: "529.982.247-25" });
      await page.locator('input[name="hireDate"]').fill("");
      await page.locator('input[name="hireDate"]').evaluate((element) => element.removeAttribute("required"));
      await page.getByRole("button", { name: /Salvar e continuar para documentos/ }).click().catch(() => undefined);
      expect(await dbOne<IdRow>(`SELECT id FROM "HrEmployee" WHERE "companyId" = $1 AND "fullName" = $2`, [COMPANY_ID, missingHireName])).toBeNull();

      await fillMinimumAdmission(page, { fullName: missingEmploymentName, cpf: "529.982.247-25" });
      await page.locator('select[name="employmentType"]').selectOption("");
      await page.locator('select[name="employmentType"]').evaluate((element) => element.removeAttribute("required"));
      await page.getByRole("button", { name: /Salvar e continuar para documentos/ }).click().catch(() => undefined);
      expect(await dbOne<IdRow>(`SELECT id FROM "HrEmployee" WHERE "companyId" = $1 AND "fullName" = $2`, [COMPANY_ID, missingEmploymentName])).toBeNull();

      await dbExec(
        `INSERT INTO "HrEmployee" (id, "companyId", "branchId", "fullName", cpf, "hireDate", "employmentType", status, active, "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,$5,$6,'CLT','ACTIVE',true,NOW(),NOW())`,
        [historicalId, COMPANY_ID, BRANCH_ID, "HOMO005 CPF Histórico", "111.444.777-35", new Date("2026-01-15T12:00:00.000Z")],
      );

      await fillMinimumAdmission(page, { fullName: duplicateName, cpf: "11144477735" });
      await page.getByRole("button", { name: /Salvar e continuar para documentos/ }).click().catch(() => undefined);
      expect(await dbOne<IdRow>(`SELECT id FROM "HrEmployee" WHERE "companyId" = $1 AND "fullName" = $2`, [COMPANY_ID, duplicateName])).toBeNull();
      const equivalent = await dbMany<IdRow>(`SELECT id FROM "HrEmployee" WHERE "companyId" = $1 AND cpf IN ('11144477735','111.444.777-35')`, [COMPANY_ID]);
      expect(equivalent.map((item) => item.id)).toEqual([historicalId]);
    } finally {
      await dbExec(`DELETE FROM "HrEmployee" WHERE id = $1 AND "companyId" = $2`, [historicalId, COMPANY_ID]);
      await closeE2eDb();
    }
  });

  test("PRE_ADMISSION cannot bypass downstream eligibility through manipulated employeeId", async ({ page }) => {
    const employeeName = unique("Pré-admissão bloqueada");
    let employeeId: string | null = null;

    try {
      await loginAsAlphaOwner(page);
      await fillMinimumAdmission(page, { fullName: employeeName, cpf: "529.982.247-25" });
      await page.getByRole("button", { name: /Salvar e continuar para documentos/ }).click();
      employeeId = page.url().match(/\/rh\/colaboradores\/([^/]+)\/documentos$/)?.[1] ?? null;
      expect(employeeId).toBeTruthy();

      await page.goto("/dp/ferias");
      await expect(page.locator('select[name="employeeId"] option', { hasText: employeeName })).toHaveCount(0);
      await injectEmployeeSelection(page, employeeId!);
      await page.locator('input[name="startDate"]').fill("2026-11-03");
      await page.locator('input[name="endDate"]').fill("2026-11-12");
      await page.getByRole("button", { name: "Registrar programação" }).click().catch(() => undefined);
      expect(await dbOne<IdRow>(`SELECT id FROM "HrVacationRequest" WHERE "companyId" = $1 AND "employeeId" = $2`, [COMPANY_ID, employeeId])).toBeNull();

      await page.goto("/dp/ponto");
      await expect(page.locator('select[name="employeeId"] option', { hasText: employeeName })).toHaveCount(0);
      await injectEmployeeSelection(page, employeeId!);
      await page.locator('input[name="referenceDate"]').fill("2026-09-09");
      await page.locator('select[name="type"]').selectOption("ATRASO");
      await page.locator('textarea[name="description"]').fill("Tentativa manipulada HOMO-005");
      await page.getByRole("button", { name: "Registrar ocorrência" }).click().catch(() => undefined);
      expect(await dbOne<IdRow>(`SELECT id FROM "HrTimeOccurrence" WHERE "companyId" = $1 AND "employeeId" = $2`, [COMPANY_ID, employeeId])).toBeNull();

      await page.goto("/dp/medidas-disciplinares");
      await expect(page.locator('select[name="employeeId"] option', { hasText: employeeName })).toHaveCount(0);
      await injectEmployeeSelection(page, employeeId!);
      await page.locator('select[name="type"]').selectOption("VERBAL_GUIDANCE");
      await page.locator('input[name="occurredAt"]').fill("2026-09-09");
      await page.locator('input[name="reason"]').fill("Tentativa manipulada HOMO-005");
      await page.getByRole("button", { name: "Registrar medida" }).click().catch(() => undefined);
      expect(await dbOne<IdRow>(`SELECT id FROM "HrDisciplinaryAction" WHERE "companyId" = $1 AND "employeeId" = $2`, [COMPANY_ID, employeeId])).toBeNull();

      await page.goto("/dp/desligamentos");
      await expect(page.locator('select[name="employeeId"] option', { hasText: employeeName })).toHaveCount(0);
      await injectEmployeeSelection(page, employeeId!);
      await page.locator('input[name="terminationDate"]').fill("2026-12-01");
      await page.getByRole("button", { name: "Concluir desligamento" }).click().catch(() => undefined);
      const stillPending = await dbOne<EmployeeRow>(`SELECT id, cpf, status, active FROM "HrEmployee" WHERE id = $1 AND "companyId" = $2`, [employeeId, COMPANY_ID]);
      expect(stillPending?.status).toBe("PRE_ADMISSION");
      expect(stillPending?.active).toBe(true);
    } finally {
      await cleanupEmployee(employeeId);
      await closeE2eDb();
    }
  });

  test("real local fixture persists, verifies, activates employee and unlocks the full DP path", async ({ page }) => {
    const employeeName = unique("Golden Path");
    let employeeId: string | null = null;

    try {
      await loginAsAlphaOwner(page);
      await fillMinimumAdmission(page, { fullName: employeeName, cpf: "390.533.447-05" });
      await page.getByRole("button", { name: /Salvar e continuar para documentos/ }).click();
      await expect(page).toHaveURL(/\/rh\/colaboradores\/[^/]+\/documentos$/);
      employeeId = page.url().match(/\/rh\/colaboradores\/([^/]+)\/documentos$/)?.[1] ?? null;
      expect(employeeId).toBeTruthy();

      const created = await dbOne<EmployeeRow>(`SELECT id, cpf, status, active FROM "HrEmployee" WHERE id = $1 AND "companyId" = $2`, [employeeId, COMPANY_ID]);
      expect(created?.cpf).toBe("39053344705");
      expect(created?.status).toBe("PRE_ADMISSION");
      expect(created?.active).toBe(true);
      await expect(page.getByRole("link", { name: /Ir para concluir admissão/ })).toHaveCount(0);

      await page.locator('select[name="type"]').selectOption("DOCUMENTO_PESSOAL");
      await page.locator('input[name="title"]').fill("Documento real HOMO-005");
      await page.locator('input[name="file"]').setInputFiles(REAL_DOCUMENT_FIXTURE);
      await page.getByRole("button", { name: "Salvar documento" }).click();
      await expect(page.getByText("Documento real HOMO-005", { exact: true })).toBeVisible();

      const document = await dbOne<DocumentRow>(`SELECT id, "storageKey", "verifiedAt" FROM "HrEmployeeDocument" WHERE "companyId" = $1 AND "employeeId" = $2 AND title = $3`, [COMPANY_ID, employeeId, "Documento real HOMO-005"]);
      expect(document?.storageKey).toMatch(/^local:/);
      expect(document?.verifiedAt).toBeNull();

      await page.reload();
      await expect(page.getByText("Documento real HOMO-005", { exact: true })).toBeVisible();
      const read = await page.request.get(`/api/hr/documents/${document!.id}/file`);
      expect(read.ok()).toBe(true);
      expect((await read.body()).subarray(0, 5).toString()).toBe("%PDF-");
      await expect(page.getByText(/1 documento\(s\) sem conferência/)).toBeVisible();
      await expect(page.getByRole("link", { name: /Ir para concluir admissão/ })).toHaveCount(0);

      await page.getByRole("button", { name: "Conferir" }).click();
      await expect(page.getByText("Conferido", { exact: true })).toBeVisible();
      await expect(page.getByRole("link", { name: /Ir para concluir admissão/ })).toBeVisible();
      expect((await dbOne<DocumentRow>(`SELECT id, "storageKey", "verifiedAt" FROM "HrEmployeeDocument" WHERE id = $1`, [document!.id]))?.verifiedAt).toBeTruthy();

      await page.getByRole("link", { name: /Ir para concluir admissão/ }).click();
      await expect(page.getByText(employeeName, { exact: true })).toBeVisible();
      await page.getByRole("button", { name: /Concluir admissão/ }).click();
      await expect(page).toHaveURL(new RegExp(`/rh/colaboradores/${employeeId}/documentos$`));
      await expect(page.getByText("Colaborador ACTIVE", { exact: true })).toBeVisible();
      const active = await dbOne<EmployeeRow>(`SELECT id, cpf, status, active FROM "HrEmployee" WHERE id = $1 AND "companyId" = $2`, [employeeId, COMPANY_ID]);
      expect(active?.status).toBe("ACTIVE");
      expect(active?.active).toBe(true);

      await page.goto(`/rh/colaboradores/${employeeId}/editar`);
      await page.getByLabel("CPF").fill("000.000.000-00");
      await page.getByRole("button", { name: "Salvar alterações" }).click().catch(() => undefined);
      expect((await dbOne<EmployeeRow>(`SELECT id, cpf, status, active FROM "HrEmployee" WHERE id = $1 AND "companyId" = $2`, [employeeId, COMPANY_ID]))?.cpf).toBe("39053344705");

      await page.goto("/dp/ferias");
      await page.locator('select[name="employeeId"]').selectOption(employeeId!);
      await page.locator('input[name="startDate"]').fill("2026-11-03");
      await page.locator('input[name="endDate"]').fill("2026-11-12");
      await page.getByRole("button", { name: "Registrar programação" }).click();
      expect(await dbOne<IdRow>(`SELECT id FROM "HrVacationRequest" WHERE "companyId" = $1 AND "employeeId" = $2`, [COMPANY_ID, employeeId])).toBeTruthy();

      await dbExec(`UPDATE "HrEmployee" SET status = 'ON_LEAVE', "updatedAt" = NOW() WHERE id = $1 AND "companyId" = $2`, [employeeId, COMPANY_ID]);
      await page.goto("/dp/ponto");
      await expect(page.locator(`select[name="employeeId"] option[value="${employeeId}"]`)).toHaveCount(1);
      await page.locator('select[name="employeeId"]').selectOption(employeeId!);
      await page.locator('input[name="referenceDate"]').fill("2026-09-09");
      await page.locator('select[name="type"]').selectOption("ATRASO");
      await page.locator('textarea[name="description"]').fill("Ocorrência sintética HOMO-005 em ON_LEAVE");
      await page.getByRole("button", { name: "Registrar ocorrência" }).click();
      expect(await dbOne<IdRow>(`SELECT id FROM "HrTimeOccurrence" WHERE "companyId" = $1 AND "employeeId" = $2`, [COMPANY_ID, employeeId])).toBeTruthy();
      await dbExec(`UPDATE "HrEmployee" SET status = 'ACTIVE', "updatedAt" = NOW() WHERE id = $1 AND "companyId" = $2`, [employeeId, COMPANY_ID]);

      await page.goto("/dp/medidas-disciplinares");
      await page.locator('select[name="employeeId"]').selectOption(employeeId!);
      await page.locator('select[name="type"]').selectOption("VERBAL_GUIDANCE");
      await page.locator('input[name="occurredAt"]').fill("2026-09-09");
      await page.locator('input[name="reason"]').fill("Registro sintético HOMO-005");
      await page.getByRole("button", { name: "Registrar medida" }).click();
      expect(await dbOne<IdRow>(`SELECT id FROM "HrDisciplinaryAction" WHERE "companyId" = $1 AND "employeeId" = $2`, [COMPANY_ID, employeeId])).toBeTruthy();

      await page.goto("/dp/desligamentos");
      await page.locator('select[name="employeeId"]').selectOption(employeeId!);
      await page.locator('input[name="terminationDate"]').fill("2026-12-01");
      await page.getByRole("button", { name: "Concluir desligamento" }).click();
      const terminated = await dbOne<EmployeeRow>(`SELECT id, cpf, status, active FROM "HrEmployee" WHERE id = $1 AND "companyId" = $2`, [employeeId, COMPANY_ID]);
      expect(terminated?.status).toBe("TERMINATED");
      expect(terminated?.active).toBe(false);
    } finally {
      await cleanupEmployee(employeeId);
      await closeE2eDb();
    }
  });
});
