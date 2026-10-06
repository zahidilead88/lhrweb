import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface RedirectRule { source: string; destination: string; statusCode: 301 | 302; enabled: boolean }

function normalizePath(p: string): string {
  return p.replace(/\/+$/, "") || "/";
}

// Phase 5 (docs/LHRWEB_MASTER_IMPLEMENTATION_PLAN.md §11.5) — redirects are
// resolved here, not in the page components. The site routes sit below
// app/(frontend)/loading.tsx, whose Suspense boundary flushes a 200 shell
// before an async page component resolves, so a redirect() call there can no
// longer change the HTTP status. Middleware runs pre-render with no
// streaming involved, so it's the only place a real 307/308 can be set.
async function fetchRedirects(url: string): Promise<RedirectRule[]> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.redirects) ? data.redirects : [];
  } catch {
    return [];
  }
}

function matchRedirect(redirects: RedirectRule[], pathname: string): RedirectRule | null {
  const requestPath = normalizePath(pathname);
  return redirects.find((r) => r.enabled && normalizePath(r.source) === requestPath) ?? null;
}

function redirectResponse(request: NextRequest, match: RedirectRule): NextResponse {
  const status = match.statusCode === 301 ? 308 : 307;
  return NextResponse.redirect(new URL(match.destination, request.url), status);
}

export async function middleware(request: NextRequest) {
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

  // robots.txt and sitemap.xml are host-aware Next.js route handlers
  // (app/robots.ts, app/sitemap.ts) — they read the Host header themselves,
  // so let them run at the root instead of being swallowed into /site/*.
  const isCrawlerFile = pathname === "/robots.txt" || pathname === "/sitemap.xml";

  if (subdomain && subdomain !== "www" && !isCrawlerFile) {
    const redirects = await fetchRedirects(`${API}/api/builder/by-slug/${subdomain}`);
    const match = matchRedirect(redirects, pathname);
    if (match) return redirectResponse(request, match);

    // Rewrite subdomain traffic internally to /site/[slug]
    const url = request.nextUrl.clone();
    url.pathname = `/site/${subdomain}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  // ── Custom domain routing ────────────────────────────────────────────────────
  if (!isRoot && !subdomain && !isCrawlerFile) {
    const redirects = await fetchRedirects(`${API}/api/builder/by-domain/${hostWithoutPort}`);
    const match = matchRedirect(redirects, pathname);
    if (match) return redirectResponse(request, match);

    const url = request.nextUrl.clone();
    url.pathname = `/site/domain/${hostWithoutPort}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  // ── Internal /site/* preview paths (same redirect rules, own-domain access) ──
  if (isRoot && !isCrawlerFile) {
    const domainPreview = pathname.match(/^\/site\/domain\/([^/]+)(\/.*)?$/);
    const idOrSlugPreview = !domainPreview ? pathname.match(/^\/site\/([^/]+)(\/.*)?$/) : null;

    if (domainPreview) {
      const [, host, rest] = domainPreview;
      const redirects = await fetchRedirects(`${API}/api/builder/by-domain/${host}`);
      const match = matchRedirect(redirects, rest || "/");
      if (match) return redirectResponse(request, match);
    } else if (idOrSlugPreview) {
      const [, identifier, rest] = idOrSlugPreview;
      const isId = /^[0-9a-fA-F]{24}$/.test(identifier);
      const lookupUrl = isId ? `${API}/api/builder/public/${identifier}` : `${API}/api/builder/by-slug/${identifier}`;
      const redirects = await fetchRedirects(lookupUrl);
      const match = matchRedirect(redirects, rest || "/");
      if (match) return redirectResponse(request, match);
    }
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
