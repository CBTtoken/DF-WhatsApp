import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/internal/login") {
    return NextResponse.next();
  }

  const cookie = request.cookies.get("internal_auth")?.value;
  if (cookie && cookie === process.env.INTERNAL_INBOX_PASSWORD) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/internal/login", request.url));
}

export const config = {
  matcher: "/internal/:path*",
};
