import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const startedAt = Date.now();
  const production = process.env.NODE_ENV === "production" || process.env.BRAVHAS_ENV === "PRODUCTION";

  try {
    await prisma.$queryRaw`SELECT 1`;

    const localDocuments = await prisma.hrEmployeeDocument.count({
      where: { storageKey: { startsWith: "local:" } },
    });

    const storageReady = !production && localDocuments >= 0;
    const ready = !production && storageReady;

    return NextResponse.json(
      {
        status: ready ? "ready" : "blocked",
        application: "bravhas",
        database: "ready",
        storage: production ? "production-provider-not-configured" : "homologation-local",
        localDocumentReferences: localDocuments,
        responseTimeMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      },
      { status: ready ? 200 : 503 },
    );
  } catch {
    return NextResponse.json(
      {
        status: "blocked",
        application: "bravhas",
        database: "unavailable",
        storage: production ? "production-provider-not-configured" : "unknown",
        responseTimeMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
