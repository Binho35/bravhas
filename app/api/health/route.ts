import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    application: "bravhas",
    check: "liveness",
    timestamp: new Date().toISOString(),
  });
}
