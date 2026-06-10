import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const { pathname } = request.nextUrl;

  // ── Subdomain routing ────────────────────────────────────────────────────────
  // Strip port for comparison (handles localhost:3000 in dev)
  const hostWithoutPort = hostname.replace(/:\d+$/, "");
  const rootWithoutPort = ROOT_DOMAIN.replace(/:\d+$/, "");

  const isRoot     = hostWithoutPort === rootWithoutPort || hostWithoutPort === `www.${rootWithoutPort}`;
  const subdomain  = !isRoot && hostWithoutPort.endsWith(`.${rootWithoutPort}`)
    ? hostWithoutPort.replace(`.${rootWithoutPort}`, "")
    : null;

  if (subdomain && subdomain !== "www") {
    // Rewrite subdomain traffic internally to /site/[slug]
    const url = request.nextUrl.clone();
    url.pathname = `/site/${subdomain}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  // ── Custom domain routing ────────────────────────────────────────────────────
  if (!isRoot && !subdomain) {
    const url = request.nextUrl.clone();
    url.pathname = `/site/domain/${hostWithoutPort}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  // ── Admin auth guard ─────────────────────────────────────────────────────────
  const token      = request.cookies.get("token")?.value;
  const isAuthPage = pathname === "/admin/login" || pathname === "/admin/register";

  if (pathname.startsWith("/admin") && !token && !isAuthPage) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|public).*)"],
};
