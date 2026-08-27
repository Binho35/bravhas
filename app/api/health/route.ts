import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const startedAt = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "ok",
      application: "bravhas",
      database: "connected",
      responseTimeMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database connection failed";

    return NextResponse.json(
      {
        status: "degraded",
        application: "bravhas",
        database: "unavailable",
        responseTimeMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
        error: process.env.NODE_ENV === "development" ? message : "Database unavailable",
      },
      { status: 503 },
    );
  }
}
