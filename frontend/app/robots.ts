import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { resolveProjectByIdentifier, resolveProjectByDomain, publicHostFor } from "@/lib/publicSite";

// Phase 1 (docs/BLUEPRINT.md) — one robots.txt for the whole app, host-aware:
// the agency's own root domain gets one robots policy, every customer
// subdomain/custom-domain gets its own (mapped to that project's sitemap).
export const dynamic = "force-dynamic";

const ROOT_DOMAIN = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000").replace(/:\d+$/, "");

export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get("host") || ROOT_DOMAIN;
  const bareHost = host.replace(/:\d+$/, "");
  const proto = ROOT_DOMAIN === "localhost" ? "http" : "https";
  const isRoot = bareHost === ROOT_DOMAIN || bareHost === `www.${ROOT_DOMAIN}`;

  if (isRoot) {
    return {
      rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/dashboard", "/builder", "/api"] }],
      sitemap: `${proto}://${host}/sitemap.xml`,
    };
  }

  const subdomain = bareHost !== "www" && bareHost.endsWith(`.${ROOT_DOMAIN}`)
    ? bareHost.slice(0, -(ROOT_DOMAIN.length + 1))
    : null;
  const project = subdomain
    ? (await resolveProjectByIdentifier(subdomain)).project
    : await resolveProjectByDomain(bareHost);

  if (!project) return { rules: [{ userAgent: "*", disallow: "/" }] };

  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${proto}://${publicHostFor(project)}/sitemap.xml`,
  };
}
