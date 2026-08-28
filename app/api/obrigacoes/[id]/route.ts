import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireObligationActor } from "@/modules/obligations/server/obligationAuth";

const AREAS = new Set(["FINANCIAL", "HR", "PAYROLL", "COMPLIANCE", "ADMINISTRATIVE"]);
const PRIORITIES = new Set(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
const STATUSES = new Set(["PENDING", "IN_PROGRESS", "COMPLETED", "OVERDUE", "CANCELED"]);
const RECURRENCES = new Set(["NONE", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"]);

type RouteContext = { params: Promise<{ id: string }> };

type ObligationRow = {
  id: string;
  companyId: string;
  title: string;
  description: string | null;
  area: string;
  priority: string;
  status: string;
  responsibleUserId: string | null;
  responsibleName: string;
  dueDate: Date;
  completedAt: Date | null;
  recurrence: string;
  notes: string | null;
  createdBy: string;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const actor = await requireObligationActor();
    const { id } = await context.params;
    const rows = await prisma.$queryRaw<ObligationRow[]>`
      SELECT * FROM "Obligation"
      WHERE "id" = ${id} AND "companyId" = ${actor.companyId}
      LIMIT 1
    `;
    if (!rows[0]) {
      return NextResponse.json({ success: false, message: "Obrigação não encontrada." }, { status: 404 });
    }
    return NextResponse.json({ success: true, obligation: rows[0] });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Não foi possível consultar a obrigação." },
      { status: 401 },
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const actor = await requireObligationActor();
    const { id } = await context.params;
    const body = await request.json();

    const existing = await prisma.$queryRaw<ObligationRow[]>`
      SELECT * FROM "Obligation"
      WHERE "id" = ${id} AND "companyId" = ${actor.companyId}
      LIMIT 1
    `;
    if (!existing[0]) {
      return NextResponse.json({ success: false, message: "Obrigação não encontrada." }, { status: 404 });
    }

    const current = existing[0];
    const title = typeof body.title === "string" ? body.title.trim() : current.title;
    const description = typeof body.description === "string" ? body.description.trim() || null : current.description;
    const area = typeof body.area === "string" ? body.area : current.area;
    const priority = typeof body.priority === "string" ? body.priority : current.priority;
    const status = typeof body.status === "string" ? body.status : current.status;
    const recurrence = typeof body.recurrence === "string" ? body.recurrence : current.recurrence;
    const responsibleName = typeof body.responsibleName === "string" ? body.responsibleName.trim() : current.responsibleName;
    const dueDate = typeof body.dueDate === "string" ? new Date(body.dueDate) : current.dueDate;
    const notes = typeof body.notes === "string" ? body.notes.trim() || null : current.notes;

    if (!title) throw new Error("Informe o título da obrigação.");
    if (!AREAS.has(area)) throw new Error("Área da obrigação inválida.");
    if (!PRIORITIES.has(priority)) throw new Error("Prioridade inválida.");
    if (!STATUSES.has(status)) throw new Error("Status inválido.");
    if (!RECURRENCES.has(recurrence)) throw new Error("Recorrência inválida.");
    if (!responsibleName) throw new Error("Informe o responsável.");
    if (Number.isNaN(dueDate.getTime())) throw new Error("Informe uma data de vencimento válida.");

    const completedAt = status === "COMPLETED" ? current.completedAt ?? new Date() : null;

    const rows = await prisma.$queryRaw<ObligationRow[]>`
      UPDATE "Obligation"
      SET
        "title" = ${title},
        "description" = ${description},
        "area" = ${area},
        "priority" = ${priority},
        "status" = ${status},
        "responsibleName" = ${responsibleName},
        "dueDate" = ${dueDate},
        "completedAt" = ${completedAt},
        "recurrence" = ${recurrence},
        "notes" = ${notes},
        "updatedBy" = ${actor.id},
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${id} AND "companyId" = ${actor.companyId}
      RETURNING *
    `;

    return NextResponse.json({ success: true, obligation: rows[0] });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Não foi possível atualizar a obrigação." },
      { status: 400 },
    );
  }
}
