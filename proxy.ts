import { NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/modules/auth/constants";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/login") {
    return NextResponse.next();
  }

  const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (hasSessionCookie) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
