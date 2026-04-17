import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  isPasswordProtectionEnabled,
  verifyPersonalSessionToken,
} from "@/lib/auth";

export function proxy(request: NextRequest) {
  if (!isPasswordProtectionEnabled()) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (pathname === "/login") {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get("cuenta_session")?.value;
  const sessionSecret = process.env.APP_SESSION_SECRET;

  if (
    !sessionCookie ||
    !sessionSecret ||
    !verifyPersonalSessionToken(sessionCookie, sessionSecret)
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
