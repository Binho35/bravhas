import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getServerAuthUser } from "@/modules/auth/server/session";

export async function GET() {
  try {
    const user = await getServerAuthUser();
    if (!user?.active) return NextResponse.json({ success: false, message: "Sessão inválida ou expirada." }, { status: 401 });
    if (user.role !== "OWNER" && user.role !== "ADMIN") return NextResponse.json({ success: false, message: "Usuário sem permissão para esta operação." }, { status: 403 });

    const companyId = user.companyId;
    const now = new Date();
    const next30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const openFinancial = { companyId, status: { in: ["OPEN", "PARTIALLY_PAID", "OVERDUE"] as const } };

    const [
      activeEmployees, preAdmissions, activeLeaves, upcomingVacations, pendingTime,
      payables, receivables, overduePayables, overdueReceivables,
      obligationsOpen, obligationsOverdue, obligationsDueSoon, obligationsCompleted,
    ] = await Promise.all([
      prisma.hrEmployee.count({ where: { companyId, active: true, status: "ACTIVE" } }),
      prisma.hrEmployee.count({ where: { companyId, active: true, status: "PRE_ADMISSION" } }),
      prisma.hrLeaveRequest.count({ where: { companyId, status: { in: ["PENDING", "APPROVED"] }, startDate: { lte: now }, OR: [{ endDate: null }, { endDate: { gte: now } }] } }),
      prisma.hrVacationRequest.count({ where: { companyId, status: { in: ["PENDING", "APPROVED"] }, startDate: { gte: now, lte: next30 } } }),
      prisma.hrTimeOccurrence.count({ where: { companyId, status: "PENDING" } }),
      prisma.financialAccount.aggregate({ where: { ...openFinancial, type: "PAYABLE" }, _count: true, _sum: { amount: true, paidAmount: true } }),
      prisma.financialAccount.aggregate({ where: { ...openFinancial, type: "RECEIVABLE" }, _count: true, _sum: { amount: true, paidAmount: true } }),
      prisma.financialAccount.count({ where: { ...openFinancial, type: "PAYABLE", dueDate: { lt: now } } }),
      prisma.financialAccount.count({ where: { ...openFinancial, type: "RECEIVABLE", dueDate: { lt: now } } }),
      prisma.obligation.count({ where: { companyId, status: { notIn: ["COMPLETED", "CANCELED"] } } }),
      prisma.obligation.count({ where: { companyId, status: { notIn: ["COMPLETED", "CANCELED"] }, dueDate: { lt: now } } }),
      prisma.obligation.count({ where: { companyId, status: { notIn: ["COMPLETED", "CANCELED"] }, dueDate: { gte: now, lte: next30 } } }),
      prisma.obligation.count({ where: { companyId, status: "COMPLETED" } }),
    ]);

    const outstanding = (row: typeof payables) => Number(row._sum.amount ?? 0) - Number(row._sum.paidAmount ?? 0);

    return NextResponse.json({
      success: true,
      people: { activeEmployees, preAdmissions, activeLeaves, upcomingVacations, pendingTime },
      financial: {
        payableCount: payables._count,
        receivableCount: receivables._count,
        totalPayable: outstanding(payables),
        totalReceivable: outstanding(receivables),
        overduePayables,
        overdueReceivables,
      },
      obligations: { open: obligationsOpen, overdue: obligationsOverdue, dueSoon: obligationsDueSoon, completed: obligationsCompleted },
    });
  } catch (error) {
    console.error("Erro ao consolidar indicadores", error instanceof Error ? { name: error.name, message: error.message } : { type: typeof error });
    return NextResponse.json({ success: false, message: "Não foi possível carregar os indicadores." }, { status: 500 });
  }
}
