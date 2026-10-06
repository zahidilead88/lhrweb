import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { resolveProjectByIdentifier, resolveProjectByDomain, canonicalUrlFor } from "@/lib/publicSite";

// Phase 1 (docs/BLUEPRINT.md) — host-aware sitemap: the agency's own root
// domain gets its static pages + CMS content, every customer subdomain or
// verified custom domain gets a sitemap of just that project's pages.
export const dynamic = "force-dynamic";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const ROOT_DOMAIN = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000").replace(/:\d+$/, "");

interface SlugRecord { slug?: string; updatedAt?: string }
interface BlogRecord { _id?: string; createdAt?: string }

async function safeJsonArray<T>(url: string): Promise<T[]> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? (data as T[]) : [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const host = (await headers()).get("host") || ROOT_DOMAIN;
  const bareHost = host.replace(/:\d+$/, "");
  const proto = ROOT_DOMAIN === "localhost" ? "http" : "https";
  const isRoot = bareHost === ROOT_DOMAIN || bareHost === `www.${ROOT_DOMAIN}`;

  if (isRoot) {
    const entries: MetadataRoute.Sitemap = [
      { url: `${proto}://${host}/`, priority: 1 },
      { url: `${proto}://${host}/pricing`, priority: 0.6 },
    ];

    const [pages, services, blogs] = await Promise.all([
      safeJsonArray<SlugRecord>(`${API}/api/pages`),
      safeJsonArray<SlugRecord>(`${API}/api/services`),
      safeJsonArray<BlogRecord>(`${API}/api/blogs`),
    ]);

    pages.forEach((p) => {
      if (!p.slug) return;
      entries.push({ url: `${proto}://${host}/${p.slug}`, lastModified: p.updatedAt, priority: 0.7 });
    });
    services.forEach((s) => {
      if (!s.slug) return;
      entries.push({ url: `${proto}://${host}/services/${s.slug}`, lastModified: s.updatedAt, priority: 0.6 });
    });
    blogs.forEach((b) => {
      if (!b._id) return;
      entries.push({ url: `${proto}://${host}/blog/${b._id}`, lastModified: b.createdAt, priority: 0.5 });
    });

    return entries;
  }

  const subdomain = bareHost !== "www" && bareHost.endsWith(`.${ROOT_DOMAIN}`)
    ? bareHost.slice(0, -(ROOT_DOMAIN.length + 1))
    : null;
  const project = subdomain
    ? (await resolveProjectByIdentifier(subdomain)).project
    : await resolveProjectByDomain(bareHost);

  if (!project) return [];

  return project.pages.map((page) => ({
    url: canonicalUrlFor(project, page),
    priority: project.pages[0]?.id === page.id ? 1 : 0.7,
  }));
}
