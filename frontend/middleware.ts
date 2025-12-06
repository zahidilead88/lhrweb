import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith("/admin");

  // If trying to access protected /admin routes without token, redirect
  if (pathname.startsWith("/admin") && !token && !isAuthPage) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If logged in and trying to access login/register page, redirect to dashboard
  if (isAuthPage && token) {
    const dashboardUrl = new URL("/admin", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}
