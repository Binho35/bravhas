import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { hrdpPermission } from "@/modules/auth/server/hrdpPermissions";
import { isLocalDocumentStorageKey } from "@/modules/hrdp/storage/localDocumentStorage";

export async function GET() {
  try {
    const actor = await hrdpPermission.colaboradores("view");
    const documents = await prisma.hrEmployeeDocument.findMany({
      where: { companyId: actor.companyId },
      select: {
        id: true, type: true, title: true, storageKey: true, issuedAt: true, expiresAt: true,
        verifiedAt: true, createdAt: true,
        employee: { select: { id: true, fullName: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 250,
    });

    return NextResponse.json({
      success: true,
      documents: documents.map((document) => ({
        ...document,
        issuedAt: document.issuedAt?.toISOString() ?? null,
        expiresAt: document.expiresAt?.toISOString() ?? null,
        verifiedAt: document.verifiedAt?.toISOString() ?? null,
        createdAt: document.createdAt.toISOString(),
        fileAvailable: Boolean(document.storageKey && isLocalDocumentStorageKey(document.storageKey)),
        externalReference: Boolean(document.storageKey && !isLocalDocumentStorageKey(document.storageKey)),
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const status = message.includes("Sessão") ? 401 : message.includes("permissão") ? 403 : 500;
    return NextResponse.json({ success: false, message: status === 500 ? "Não foi possível carregar os documentos." : message }, { status });
  }
}
