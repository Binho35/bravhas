import { NextRequest, NextResponse } from "next/server";

import { CreateFinancialAccountUseCase } from "@/modules/financial/application/use-cases/CreateFinancialAccountUseCase";
import { ListFinancialAccountsUseCase } from "@/modules/financial/application/use-cases/ListFinancialAccountsUseCase";
import { PrismaFinancialAccountRepository } from "@/modules/financial/infrastructure/repositories/PrismaFinancialAccountRepository";
import { assertFinancialReferences, requireFinancialActor } from "@/modules/financial/server/financialAuth";

const repository = new PrismaFinancialAccountRepository();
const createFinancialAccountUseCase = new CreateFinancialAccountUseCase(repository);
const listFinancialAccountsUseCase = new ListFinancialAccountsUseCase(repository);

export async function GET(request: NextRequest) {
  try {
    const actor = await requireFinancialActor();
    const searchParams = request.nextUrl.searchParams;
    const branchId = searchParams.get("branchId") ?? undefined;
    const supplierId = searchParams.get("supplierId") ?? undefined;
    const customerId = searchParams.get("customerId") ?? undefined;
    const categoryId = searchParams.get("categoryId") ?? undefined;
    const costCenterId = searchParams.get("costCenterId") ?? undefined;
    const bankAccountId = searchParams.get("bankAccountId") ?? undefined;

    await assertFinancialReferences(actor.companyId, {
      branchId,
      supplierId,
      customerId,
      categoryId,
      costCenterId,
      bankAccountId,
    });

    const dueDateFromValue = searchParams.get("dueDateFrom");
    const dueDateToValue = searchParams.get("dueDateTo");
    const dueDateFrom = dueDateFromValue ? new Date(dueDateFromValue) : undefined;
    const dueDateTo = dueDateToValue ? new Date(dueDateToValue) : undefined;

    if (dueDateFrom && Number.isNaN(dueDateFrom.getTime())) throw new Error("Data inicial inválida.");
    if (dueDateTo && Number.isNaN(dueDateTo.getTime())) throw new Error("Data final inválida.");

    const accounts = await listFinancialAccountsUseCase.execute({
      companyId: actor.companyId,
      branchId,
      type: (searchParams.get("type") as "PAYABLE" | "RECEIVABLE" | null) ?? undefined,
      status: (searchParams.get("status") as
        | "OPEN"
        | "PARTIALLY_PAID"
        | "PAID"
        | "OVERDUE"
        | "CANCELED"
        | null) ?? undefined,
      supplierId,
      customerId,
      categoryId,
      costCenterId,
      bankAccountId,
      dueDateFrom,
      dueDateTo,
    });

    return NextResponse.json({ success: true, ...accounts });
  } catch (error) {
    console.error("Erro ao listar contas financeiras:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Não foi possível listar as contas financeiras." },
      { status: 400 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireFinancialActor();
    const body = await request.json();

    const branchId = String(body.branchId ?? "").trim();
    const description = String(body.description ?? "").trim();
    if (!branchId) throw new Error("A filial é obrigatória.");
    if (!description) throw new Error("A descrição da conta financeira é obrigatória.");

    const issueDate = new Date(body.issueDate);
    const dueDate = new Date(body.dueDate);
    if (Number.isNaN(issueDate.getTime())) throw new Error("A data de emissão é inválida.");
    if (Number.isNaN(dueDate.getTime())) throw new Error("A data de vencimento é inválida.");

    const refs = {
      branchId,
      costCenterId: body.costCenterId ?? null,
      categoryId: body.categoryId ?? null,
      supplierId: body.supplierId ?? null,
      customerId: body.customerId ?? null,
      bankAccountId: body.bankAccountId ?? null,
    };
    await assertFinancialReferences(actor.companyId, refs);

    const account = await createFinancialAccountUseCase.execute({
      id: crypto.randomUUID(),
      companyId: actor.companyId,
      branchId,
      costCenterId: refs.costCenterId,
      categoryId: refs.categoryId,
      supplierId: refs.supplierId,
      customerId: refs.customerId,
      bankAccountId: refs.bankAccountId,
      type: body.type,
      description,
      documentNumber: body.documentNumber ?? null,
      issueDate,
      dueDate,
      amount: Number(body.amount),
      discount: Number(body.discount ?? 0),
      interest: Number(body.interest ?? 0),
      fine: Number(body.fine ?? 0),
      notes: body.notes ?? null,
      createdBy: actor.id,
    });

    return NextResponse.json({ success: true, account: account.data }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar conta financeira:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Não foi possível criar a conta financeira." },
      { status: 400 },
    );
  }
}
