import { expect, test } from "@playwright/test";

import { closeE2eDb, dbExec, dbOne } from "./helpers/db";
import { loginAsAlphaOwner } from "./helpers/auth";

const COMPANY_ID = "E2E-COMPANY-ALPHA";

type DocumentRow = {
  id: string;
  title: string;
  type: string;
  storageKey: string | null;
  expiresAt: Date | null;
};
type IdRow = { id: string };

function unique(label: string) {
  return `E2E ${label} ${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;
}

test("document metadata can be edited, reloaded and audited without changing storage", async ({ page }) => {
  const employeeId = `E2E-DOC-EDIT-EMP-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;
  const documentId = `E2E-DOC-EDIT-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;
  const employeeNumber = `DOC-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
  const cpf = `DOC-CPF-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;
  const originalTitle = unique("Documento Original");
  const editedTitle = unique("Documento Atualizado");
  const storageKey = `external:e2e-document-edit:${documentId}`;

  try {
    await dbExec(
      `INSERT INTO "HrEmployee" (id, "companyId", "branchId", "employeeNumber", "fullName", cpf, "hireDate", "employmentType", status, active) VALUES ($1, $2, $3, $4, $5, $6, $7::timestamp, $8::"EmploymentType", $9::"EmployeeStatus", true)`,
      [employeeId, COMPANY_ID, "E2E-BRANCH-ALPHA", employeeNumber, unique("Colaborador Documento"), cpf, "2026-09-01T12:00:00.000Z", "CLT", "ACTIVE"],
    );
    await dbExec(
      `INSERT INTO "HrEmployeeDocument" (id, "companyId", "employeeId", type, title, "storageKey", "issuedAt") VALUES ($1, $2, $3, $4, $5, $6, $7::timestamp)`,
      [documentId, COMPANY_ID, employeeId, "DOCUMENTO_PESSOAL", originalTitle, storageKey, "2026-09-01T12:00:00.000Z"],
    );

    await loginAsAlphaOwner(page);
    await page.goto(`/documentos/${documentId}`);
    await expect(page.getByRole("heading", { name: originalTitle })).toBeVisible();

    await page.getByLabel("Título do documento").fill(editedTitle);
    await page.getByLabel("Tipo do documento").selectOption("CONTRATO");
    await page.locator('input[name="expiresAt"]').fill("2027-09-01");
    await page.getByLabel("Observações do documento").fill("Metadados alterados pelo golden path documental.");
    await page.getByRole("button", { name: "Salvar metadados" }).click();
    await expect(page).toHaveURL(new RegExp(`/documentos/${documentId}$`));
    await expect(page.getByRole("heading", { name: editedTitle })).toBeVisible();

    await page.reload();
    await expect(page.getByLabel("Título do documento")).toHaveValue(editedTitle);
    await expect(page.getByLabel("Tipo do documento")).toHaveValue("CONTRATO");

    const persisted = await dbOne<DocumentRow>(
      `SELECT id, title, type, "storageKey", "expiresAt" FROM "HrEmployeeDocument" WHERE id = $1 AND "companyId" = $2`,
      [documentId, COMPANY_ID],
    );
    expect(persisted?.title).toBe(editedTitle);
    expect(persisted?.type).toBe("CONTRATO");
    expect(persisted?.storageKey).toBe(storageKey);
    expect(persisted?.expiresAt?.toISOString().slice(0, 10)).toBe("2027-09-01");

    expect(await dbOne<IdRow>(
      `SELECT id FROM "HrAuditEvent" WHERE "companyId" = $1 AND "entityType" = 'HrEmployeeDocument' AND "entityId" = $2 AND action = 'EMPLOYEE_DOCUMENT_UPDATED' LIMIT 1`,
      [COMPANY_ID, documentId],
    )).toBeTruthy();

    await page.goto(`/rh/colaboradores/${employeeId}/historico`);
    await expect(page.getByText("Documento atualizado")).toBeVisible();

    const foreign = await page.goto("/documentos/E2E-DOC-BETA-FOREIGN");
    expect(foreign?.status()).toBe(404);
  } finally {
    await dbExec(
      `DELETE FROM "HrAuditEvent" WHERE "companyId" = $1 AND "entityType" = 'HrEmployeeDocument' AND "entityId" = $2`,
      [COMPANY_ID, documentId],
    );
    await dbExec(`DELETE FROM "HrEmployeeDocument" WHERE "companyId" = $1 AND id = $2`, [COMPANY_ID, documentId]);
    await dbExec(`DELETE FROM "HrEmployee" WHERE "companyId" = $1 AND id = $2`, [COMPANY_ID, employeeId]);
    await closeE2eDb();
  }
});
