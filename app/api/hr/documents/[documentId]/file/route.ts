import path from "node:path";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { hrdpPermission } from "@/modules/auth/server/hrdpPermissions";
import {
  isLocalDocumentStorageKey,
  localDocumentOriginalName,
  readLocalDocumentFile,
} from "@/modules/hrdp/storage/localDocumentStorage";

function contentTypeFromName(name: string) {
  const extension = path.extname(name).toLowerCase();
  if (extension === ".pdf") return "application/pdf";
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".png") return "image/png";
  if (extension === ".webp") return "image/webp";
  return "application/octet-stream";
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  try {
    const actor = await hrdpPermission.colaboradores("view");
    const { documentId } = await params;

    const document = await prisma.hrEmployeeDocument.findFirst({
      where: { id: documentId, companyId: actor.companyId },
      select: { id: true, storageKey: true, title: true },
    });

    if (!document?.storageKey || !isLocalDocumentStorageKey(document.storageKey)) {
      return NextResponse.json({ success: false, message: "Arquivo não encontrado." }, { status: 404 });
    }

    const fileName = localDocumentOriginalName(document.storageKey) || `${document.title}.pdf`;
    const bytes = await readLocalDocumentFile(document.storageKey);

    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        "Content-Type": contentTypeFromName(fileName),
        "Content-Length": String(bytes.byteLength),
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ success: false, message: "Não foi possível abrir o arquivo." }, { status: 404 });
  }
}
