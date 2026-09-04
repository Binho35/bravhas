import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireObligationActor } from "@/modules/obligations/server/obligationAuth";

const AREAS = new Set(["FINANCIAL", "HR", "PAYROLL", "COMPLIANCE", "ADMINISTRATIVE"]);
const PRIORITIES = new Set(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
const STATUSES = new Set(["PENDING", "IN_PROGRESS", "COMPLETED", "OVERDUE", "CANCELED"]);
const RECURRENCES = new Set(["NONE", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"]);

export async function GET() {
  try {
    const actor = await requireObligationActor();
    const obligations = await prisma.obligation.findMany({
      where: { companyId: actor.companyId },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ success: true, obligations });
  } catch (error) {
    console.error("Erro ao listar obrigações:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Não foi possível carregar as obrigações." },
      { status: 401 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireObligationActor();
    const body = await request.json();

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description = typeof body.description === "string" && body.description.trim() ? body.description.trim() : null;
    const area = typeof body.area === "string" ? body.area : "";
    const priority = typeof body.priority === "string" ? body.priority : "MEDIUM";
    const status = typeof body.status === "string" ? body.status : "PENDING";
    const recurrence = typeof body.recurrence === "string" ? body.recurrence : "NONE";
    const responsibleName = typeof body.responsibleName === "string" ? body.responsibleName.trim() : actor.name;
    const dueDate = typeof body.dueDate === "string" ? new Date(body.dueDate) : new Date(Number.NaN);
    const notes = typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null;

    if (!title) throw new Error("Informe o título da obrigação.");
    if (!AREAS.has(area)) throw new Error("Área da obrigação inválida.");
    if (!PRIORITIES.has(priority)) throw new Error("Prioridade inválida.");
    if (!STATUSES.has(status)) throw new Error("Status inválido.");
    if (!RECURRENCES.has(recurrence)) throw new Error("Recorrência inválida.");
    if (!responsibleName) throw new Error("Informe o responsável.");
    if (Number.isNaN(dueDate.getTime())) throw new Error("Informe uma data de vencimento válida.");

    const obligation = await prisma.obligation.create({
      data: {
        id: randomUUID(),
        companyId: actor.companyId,
        title,
        description,
        area,
        priority,
        status,
        responsibleUserId: actor.id,
        responsibleName,
        dueDate,
        completedAt: status === "COMPLETED" ? new Date() : null,
        recurrence,
        notes,
        createdBy: actor.id,
        updatedBy: actor.id,
      },
    });

    return NextResponse.json({ success: true, obligation }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar obrigação:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Não foi possível criar a obrigação." },
      { status: 400 },
    );
  }
}
