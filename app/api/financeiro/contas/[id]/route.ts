import { NextRequest, NextResponse } from "next/server";

import { GetFinancialAccountUseCase } from "@/modules/financial/application/use-cases/GetFinancialAccountUseCase";
import { UpdateFinancialAccountUseCase } from "@/modules/financial/application/use-cases/UpdateFinancialAccountUseCase";
import { DeleteFinancialAccountUseCase } from "@/modules/financial/application/use-cases/DeleteFinancialAccountUseCase";
import { PrismaFinancialAccountRepository } from "@/modules/financial/infrastructure/repositories/PrismaFinancialAccountRepository";
import {
  assertFinancialReferences,
  requireFinancialAccount,
} from "@/modules/financial/server/financialAuth";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const repository = new PrismaFinancialAccountRepository();

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    await requireFinancialAccount(id);

    const account = await new GetFinancialAccountUseCase(repository).execute({ id: id.trim() });
    if (!account) {
      return NextResponse.json({ success: false, message: "Conta financeira não encontrada." }, { status: 404 });
    }

    return NextResponse.json({ success: true, account: account.data });
  } catch (error) {
    console.error("Erro ao consultar conta financeira:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Não foi possível consultar a conta financeira." },
      { status: 400 },
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const accountId = id.trim();
    const { actor } = await requireFinancialAccount(accountId);
    const existingAccount = await repository.findById(accountId);

    if (!existingAccount || existingAccount.data.companyId !== actor.companyId) {
      return NextResponse.json({ success: false, message: "Conta financeira não encontrada." }, { status: 404 });
    }

    const body = await request.json();
    const description = String(body.description ?? existingAccount.data.description).trim();
    if (!description) throw new Error("A descrição da conta financeira é obrigatória.");

    const issueDate = body.issueDate !== undefined ? new Date(body.issueDate) : existingAccount.data.issueDate;
    const dueDate = body.dueDate !== undefined ? new Date(body.dueDate) : existingAccount.data.dueDate;
    if (Number.isNaN(issueDate.getTime())) throw new Error("A data de emissão é inválida.");
    if (Number.isNaN(dueDate.getTime())) throw new Error("A data de vencimento é inválida.");

    const amount = body.amount !== undefined ? Number(body.amount) : existingAccount.data.amount;
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("O valor da conta financeira deve ser maior que zero.");

    const branchId = body.branchId !== undefined ? String(body.branchId).trim() : existingAccount.data.branchId;
    const costCenterId = body.costCenterId !== undefined ? body.costCenterId || null : existingAccount.data.costCenterId;
    const categoryId = body.categoryId !== undefined ? body.categoryId || null : existingAccount.data.categoryId;
    const supplierId = body.supplierId !== undefined ? body.supplierId || null : existingAccount.data.supplierId;
    const customerId = body.customerId !== undefined ? body.customerId || null : existingAccount.data.customerId;
    const bankAccountId = body.bankAccountId !== undefined ? body.bankAccountId || null : existingAccount.data.bankAccountId;

    await assertFinancialReferences(actor.companyId, {
      branchId,
      costCenterId,
      categoryId,
      supplierId,
      customerId,
      bankAccountId,
    });

    const updatedAccount = existingAccount.update({
      branchId,
      costCenterId,
      categoryId,
      supplierId,
      customerId,
      bankAccountId,
      type: body.type !== undefined ? body.type : existingAccount.data.type,
      description,
      documentNumber: body.documentNumber !== undefined ? body.documentNumber : existingAccount.data.documentNumber,
      issueDate,
      dueDate,
      amount,
      discount: body.discount !== undefined ? Number(body.discount) : existingAccount.data.discount,
      interest: body.interest !== undefined ? Number(body.interest) : existingAccount.data.interest,
      fine: body.fine !== undefined ? Number(body.fine) : existingAccount.data.fine,
      notes: body.notes !== undefined ? body.notes : existingAccount.data.notes,
      updatedBy: actor.id,
      updatedAt: new Date(),
    });

    const account = await new UpdateFinancialAccountUseCase(repository).execute({ account: updatedAccount });
    return NextResponse.json({ success: true, account: account.data });
  } catch (error) {
    console.error("Erro ao atualizar conta financeira:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Não foi possível atualizar a conta financeira." },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    await requireFinancialAccount(id);
    await new DeleteFinancialAccountUseCase(repository).execute({ id: id.trim() });
    return NextResponse.json({ success: true, message: "Conta financeira excluída com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir conta financeira:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Não foi possível excluir a conta financeira." },
      { status: 400 },
    );
  }
}
