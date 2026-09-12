import { NextResponse } from "next/server";

import { resolveRequestId } from "@/lib/observability";

export async function GET(request: Request) {
  const requestId = resolveRequestId(request);
  const response = NextResponse.json({
    status: "ok",
    application: "bravhas",
    check: "liveness",
    timestamp: new Date().toISOString(),
  });
  response.headers.set("X-Request-ID", requestId);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
