import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/post", "/schedule", "/context", "/hearing", "/settings"];

function needsAuth(pathname: string): boolean {
  if (pathname === "/") return true;
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!needsAuth(pathname)) return NextResponse.next();

  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASSWORD;
  if (!user || !pass) return NextResponse.next(); // auth not configured (e.g. local dev)

  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Basic ")) {
    const decoded = atob(authHeader.slice(6));
    const separatorIndex = decoded.indexOf(":");
    const providedUser = decoded.slice(0, separatorIndex);
    const providedPass = decoded.slice(separatorIndex + 1);
    if (providedUser === user && providedPass === pass) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Xency AI"' },
  });
}

export const config = {
  matcher: [
    "/",
    "/post/:path*",
    "/schedule/:path*",
    "/context/:path*",
    "/hearing/:path*",
    "/settings/:path*",
    "/api/clients/:path*",
    "/api/posts/:path*",
    "/api/context/:path*",
    "/api/hearing/:path*",
    "/api/schedule/:path*",
  ],
};
