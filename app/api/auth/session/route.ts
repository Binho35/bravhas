import { NextResponse } from "next/server";

import { getServerAuthSession } from "@/modules/auth/server/session";

export async function GET() {
  const session = await getServerAuthSession();

  if (!session) {
    return NextResponse.json(
      { authenticated: false, session: null },
      { status: 401 },
    );
  }

  const { user } = session;

  return NextResponse.json({
    authenticated: true,
    session: {
      token: "SERVER_COOKIE",
      authenticated: true,
      createdAt: session.createdAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
      user: {
        id: user.id,
        companyId: user.companyId,
        branchId: user.branchId,
        companyPrefix: user.companyPrefix,
        username: user.username,
        loginId: user.loginId,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    },
  });
}
