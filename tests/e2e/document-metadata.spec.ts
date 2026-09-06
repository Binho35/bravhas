import { expect, test } from "@playwright/test";

import { prisma } from "../../lib/prisma";
import { loginAsAlphaOwner } from "./helpers/auth";

function unique(label: string) {
  return `E2E ${label} ${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;
}

test("document metadata can be edited, reloaded and audited without changing storage", async ({ page }) => {
  const employeeId = `E2E-DOC-EDIT-EMP-${Date.now()}`;
  const documentId = `E2E-DOC-EDIT-${Date.now()}`;
  const originalTitle = unique("Documento Original");
  const editedTitle = unique("Documento Atualizado");
  const storageKey = `external:e2e-document-edit:${documentId}`;

  await prisma.hrEmployee.create({
    data: {
      id: employeeId,
      companyId: "E2E-COMPANY-ALPHA",
      branchId: "E2E-BRANCH-ALPHA",
      employeeNumber: `DOC-${Date.now()}`,
      fullName: unique("Colaborador Documento"),
      cpf: `DOC-CPF-${Date.now()}`,
      hireDate: new Date("2026-09-01T12:00:00.000Z"),
      employmentType: "CLT",
      status: "ACTIVE",
      active: true,
    },
  });
  await prisma.hrEmployeeDocument.create({
    data: {
      id: documentId,
      companyId: "E2E-COMPANY-ALPHA",
      employeeId,
      type: "DOCUMENTO_PESSOAL",
      title: originalTitle,
      storageKey,
      issuedAt: new Date("2026-09-01T12:00:00.000Z"),
    },
  });

  try {
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

    const persisted = await prisma.hrEmployeeDocument.findUnique({ where: { id: documentId } });
    expect(persisted?.title).toBe(editedTitle);
    expect(persisted?.type).toBe("CONTRATO");
    expect(persisted?.storageKey).toBe(storageKey);
    expect(persisted?.expiresAt?.toISOString().slice(0, 10)).toBe("2027-09-01");

    expect(await prisma.hrAuditEvent.findFirst({
      where: {
        companyId: "E2E-COMPANY-ALPHA",
        entityType: "HrEmployeeDocument",
        entityId: documentId,
        action: "EMPLOYEE_DOCUMENT_UPDATED",
      },
    })).toBeTruthy();

    await page.goto(`/rh/colaboradores/${employeeId}/historico`);
    await expect(page.getByText("Documento atualizado")).toBeVisible();

    const foreign = await page.goto("/documentos/E2E-DOC-BETA-FOREIGN");
    expect(foreign?.status()).toBe(404);
  } finally {
    await prisma.hrAuditEvent.deleteMany({ where: { companyId: "E2E-COMPANY-ALPHA", entityType: "HrEmployeeDocument", entityId: documentId } });
    await prisma.hrEmployeeDocument.deleteMany({ where: { id: documentId } });
    await prisma.hrEmployee.deleteMany({ where: { id: employeeId } });
  }
});
