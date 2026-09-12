import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { logServerFailure, serverErrorStatus } from "@/lib/serverErrors";
import { hrdpPermission } from "@/modules/auth/server/hrdpPermissions";
import { StorageError } from "@/modules/hrdp/storage/documentStorage";
import { documentStorageForKey } from "@/modules/hrdp/storage/storageRuntime";

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

    const storage = documentStorageForKey(document?.storageKey);
    if (!document?.storageKey || !storage) {
      return NextResponse.json({ success: false, message: "Arquivo não encontrado." }, { status: 404 });
    }

    const file = await storage.read({
      companyId: actor.companyId,
      employeeId: document.employeeId,
      storageKey: document.storageKey,
    });
    const responseBytes = new Uint8Array(file.bytes.byteLength);
    responseBytes.set(file.bytes);

    return new NextResponse(responseBytes.buffer, {
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
    const message =
      status === 401 || status === 403
        ? "Acesso não autorizado."
        : status === 503
          ? "Armazenamento documental indisponível."
          : "Arquivo não encontrado.";
    return NextResponse.json(
      { success: false, message },
      { status: status === 500 ? 404 : status },
    );
  }
}
