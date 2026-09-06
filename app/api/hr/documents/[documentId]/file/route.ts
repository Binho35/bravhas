import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { logServerFailure, serverErrorStatus } from "@/lib/serverErrors";
import { hrdpPermission } from "@/modules/auth/server/hrdpPermissions";
import { StorageError } from "@/modules/hrdp/storage/documentStorage";
import { isLocalDocumentStorageKey, localDocumentStorage } from "@/modules/hrdp/storage/localDocumentStorage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  try {
    const actor = await hrdpPermission.colaboradores("view");
    const { documentId } = await params;

    const document = await prisma.hrEmployeeDocument.findFirst({
      where: { id: documentId, companyId: actor.companyId },
      select: { id: true, employeeId: true, storageKey: true },
    });

    if (!document?.storageKey || !isLocalDocumentStorageKey(document.storageKey)) {
      return NextResponse.json({ success: false, message: "Arquivo não encontrado." }, { status: 404 });
    }

    const file = await localDocumentStorage.read({
      companyId: actor.companyId,
      employeeId: document.employeeId,
      storageKey: document.storageKey,
    });

    return new NextResponse(file.bytes, {
      status: 200,
      headers: {
        "Content-Type": file.mimeType,
        "Content-Length": String(file.size),
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(file.originalName)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    logServerFailure("Erro ao abrir documento", error);
    const status =
      error instanceof StorageError && (error.code === "RESOURCE_NOT_FOUND" || error.code === "TENANT_ACCESS_DENIED")
        ? 404
        : serverErrorStatus(error);
    return NextResponse.json(
      { success: false, message: status === 401 || status === 403 ? "Acesso não autorizado." : "Arquivo não encontrado." },
      { status: status === 500 ? 404 : status },
    );
  }
}
