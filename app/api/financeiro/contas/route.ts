import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { logServerFailure, safeErrorMessage, serverErrorStatus } from "@/lib/serverErrors";
import { requireFinancialActor } from "@/modules/financial/server/financialAuth";

const CREATE_SAFE_ERRORS = [
  "Informe a descrição da conta.",
  "Tipo de conta financeira inválido.",
  "Informe um valor válido.",
  "Informe uma data de vencimento válida.",
  "Data de emissão inválida.",
  "Nenhuma unidade ativa disponível para o lançamento financeiro.",
] as const;

export async function GET() {
  try {
    const actor = await requireFinancialActor();
    const accounts = await prisma.financialAccount.findMany({
      where: { companyId: actor.companyId },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ success: true, accounts });
  } catch (error) {
    logServerFailure("Erro ao listar contas financeiras", error);
    return NextResponse.json(
      { success: false, message: "Não foi possível carregar as contas financeiras." },
      { status: serverErrorStatus(error) },
    );
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireFinancialActor();
    const body = await request.json();

    const description = typeof body.description === "string" ? body.description.trim() : "";
    const type = body.type === "PAYABLE" || body.type === "RECEIVABLE" ? body.type : null;
    const amount = typeof body.amount === "number" ? body.amount : Number(body.amount);
    const dueDate = typeof body.dueDate === "string" ? new Date(body.dueDate) : new Date(Number.NaN);
    const issueDate = typeof body.issueDate === "string" && body.issueDate.trim() ? new Date(body.issueDate) : new Date();

    if (!description) throw new Error("Informe a descrição da conta.");
    if (!type) throw new Error("Tipo de conta financeira inválido.");
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("Informe um valor válido.");
    if (Number.isNaN(dueDate.getTime())) throw new Error("Informe uma data de vencimento válida.");
    if (Number.isNaN(issueDate.getTime())) throw new Error("Data de emissão inválida.");

    const branch = actor.branchId
      ? await prisma.branch.findFirst({ where: { id: actor.branchId, companyId: actor.companyId, active: true }, select: { id: true } })
      : await prisma.branch.findFirst({ where: { companyId: actor.companyId, active: true }, orderBy: { createdAt: "asc" }, select: { id: true } });

    if (!branch) throw new Error("Nenhuma unidade ativa disponível para o lançamento financeiro.");

    const categoryName = typeof body.categoryName === "string" ? body.categoryName.trim() : "";
    const costCenterName = typeof body.costCenterName === "string" ? body.costCenterName.trim() : "";

    const category = categoryName
      ? await prisma.financialCategory.upsert({
          where: { id: `CAT-${actor.companyId}-${categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}` },
          update: { active: true },
          create: {
            id: `CAT-${actor.companyId}-${categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`,
            companyId: actor.companyId,
            branchId: branch.id,
            name: categoryName,
            active: true,
          },
          select: { id: true },
        })
      : null;

    const costCenter = costCenterName
      ? await prisma.costCenter.upsert({
          where: { id: `CC-${actor.companyId}-${costCenterName.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}` },
          update: { active: true },
          create: {
            id: `CC-${actor.companyId}-${costCenterName.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`,
            companyId: actor.companyId,
            branchId: branch.id,
            name: costCenterName,
            active: true,
          },
          select: { id: true },
        })
      : null;

    const account = await prisma.financialAccount.create({
      data: {
        companyId: actor.companyId,
        branchId: branch.id,
        categoryId: category?.id ?? null,
        costCenterId: costCenter?.id ?? null,
        type,
        status: "OPEN",
        description,
        documentNumber: typeof body.documentNumber === "string" && body.documentNumber.trim() ? body.documentNumber.trim() : null,
        issueDate,
        dueDate,
        amount,
        paidAmount: 0,
        discount: 0,
        interest: 0,
        fine: 0,
        notes: typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null,
        createdBy: actor.id,
      },
    });

    return NextResponse.json({ success: true, account }, { status: 201 });
  } catch (error) {
    logServerFailure("Erro ao criar conta financeira", error);
    const validationError = error instanceof Error && CREATE_SAFE_ERRORS.includes(error.message as (typeof CREATE_SAFE_ERRORS)[number]);
    return NextResponse.json(
      { success: false, message: safeErrorMessage(error, CREATE_SAFE_ERRORS, "Não foi possível criar a conta financeira.") },
      { status: validationError ? 400 : serverErrorStatus(error) },
    );
  }
}
