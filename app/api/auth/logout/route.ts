import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  clearSessionCookie,
  getServerAuthUser,
} from "@/modules/auth/server/session";

export async function POST() {
  const user = await getServerAuthUser();

  if (user) {
    await prisma.userSession.updateMany({
      where: {
        userId: user.id,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { revokedAt: new Date() },
    });
  }

  await clearSessionCookie();

  return NextResponse.json({ success: true });
}