import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage =
    pathname === "/admin/login" || pathname === "/admin/register";

  // Redirect unauthenticated users away from protected admin routes
  if (pathname.startsWith("/admin") && !token && !isAuthPage) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect already-authenticated users away from login/register
  if (isAuthPage && token) {
    const dashboardUrl = new URL("/admin", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
