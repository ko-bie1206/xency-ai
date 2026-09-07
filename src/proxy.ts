import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const PROTECTED_PREFIXES = [
  "/post",
  "/thread",
  "/hook",
  "/theme",
  "/schedule",
  "/context",
  "/hearing",
  "/settings",
];

function needsAuth(pathname: string): boolean {
  if (pathname === "/") return true;
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  if (!needsAuth(pathname)) return NextResponse.next();
  if (!req.auth) {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/",
    "/post/:path*",
    "/thread/:path*",
    "/hook/:path*",
    "/theme/:path*",
    "/schedule/:path*",
    "/context/:path*",
    "/hearing/:path*",
    "/settings/:path*",
    "/api/clients/:path*",
    "/api/posts/:path*",
    "/api/thread/:path*",
    "/api/hooks/:path*",
    "/api/themes/:path*",
    "/api/reference-materials/:path*",
    "/api/context/:path*",
    "/api/hearing/:path*",
    "/api/schedule/:path*",
    "/api/allowed-emails/:path*",
  ],
};
