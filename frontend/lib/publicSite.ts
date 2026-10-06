// Phase 1 (docs/BLUEPRINT.md) — shared resolve/metadata helpers for the public
// site-serving path (subdomain + custom domain). Safe to call from a server
// component: no browser-only APIs, just fetch().

import type { ElementNode, StyleClass, SiteTokens, CmsEntry, CmsTemplate, Product, ProductCollection, ProductTemplate, Menu, Redirect } from "@/types/builder";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";
const IS_LOCAL_ROOT = ROOT_DOMAIN.replace(/:\d+$/, "") === "localhost";

export interface PublicPageSeo {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
}

export interface PublicBlock {
  id: string;
  type: string;
  content: Record<string, unknown>;
  styles?: Record<string, unknown>;
}

export interface PublicPage {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  blocks: PublicBlock[];
  elements: ElementNode[];
  seo?: PublicPageSeo;
  cmsTemplate?: CmsTemplate;
  productTemplate?: ProductTemplate;
}

export interface PublicProject {
  _id: string;
  businessName: string;
  tagline?: string;
  primaryColor: string;
  package?: string;
  status: string;
  slug?: string;
  customDomain?: string;
  customDomainVerified?: boolean;
  pages: PublicPage[];
  classes?: StyleClass[];
  tokens?: SiteTokens;
  menus?: Menu[];
  redirects?: Redirect[];
  notFoundPageId?: string;
}

async function fetchProject(url: string): Promise<PublicProject | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as PublicProject;
  } catch {
    return null;
  }
}

/** Published CMS entries for a project — for resolving `cmsBinding`s at render time. */
export async function fetchPublicCmsEntries(projectId: string): Promise<CmsEntry[]> {
  try {
    const res = await fetch(`${API}/api/cms-collections/public/${projectId}`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.entries) ? (data.entries as CmsEntry[]) : [];
  } catch {
    return [];
  }
}

/** Active products (+ collections) for a project — for storefront rendering. */
export async function fetchPublicProducts(projectId: string): Promise<{ products: Product[]; collections: ProductCollection[] }> {
  try {
    const res = await fetch(`${API}/api/commerce/public/${projectId}`, { cache: "no-store" });
    if (!res.ok) return { products: [], collections: [] };
    const data = await res.json();
    return {
      products: Array.isArray(data?.products) ? (data.products as Product[]) : [],
      collections: Array.isArray(data?.collections) ? (data.collections as ProductCollection[]) : [],
    };
  } catch {
    return { products: [], collections: [] };
  }
}

/** Resolves a `/site/[identifier]` segment — a Mongo _id (internal preview link) or a project slug (real subdomain visit). */
export async function resolveProjectByIdentifier(identifier: string): Promise<{ project: PublicProject | null; isPreview: boolean }> {
  const isId = /^[0-9a-fA-F]{24}$/.test(identifier);
  const url = isId ? `${API}/api/builder/public/${identifier}` : `${API}/api/builder/by-slug/${identifier}`;
  const project = await fetchProject(url);
  return { project, isPreview: isId };
}

/** Resolves a verified custom domain to its project. */
export async function resolveProjectByDomain(host: string): Promise<PublicProject | null> {
  const bareHost = host.replace(/:\d+$/, "");
  return fetchProject(`${API}/api/builder/by-domain/${bareHost}`);
}

export function pickActivePage(project: PublicProject, slugParam?: string | null): PublicPage | null {
  if (!project.pages.length) return null;
  return project.pages.find((p) => p.slug === slugParam) ?? project.pages[0];
}

/**
 * Phase 5 §11.5 — redirects, matched by real path (`rest`), not `?slug=`. A
 * trailing slash is ignored on both sides so "/old-page" and "/old-page/"
 * behave the same. Checked before any page resolution, by both route files.
 */
export function resolveRedirect(project: PublicProject, rest: string[] | undefined): { destination: string; permanent: boolean } | null {
  const requestPath = `/${(rest ?? []).join("/")}`.replace(/\/+$/, "") || "/";
  const match = (project.redirects ?? []).find(
    (r) => r.enabled && (r.source.replace(/\/+$/, "") || "/") === requestPath
  );
  if (!match) return null;
  return { destination: match.destination, permanent: match.statusCode === 301 };
}

/**
 * Phase 5 §11.1 — page hierarchy: a page's full nested path, root-first, e.g.
 * `["services", "web-design"]`. Cycle-guarded (a page can't resolve through
 * its own ancestry twice) so a corrupt/circular `parentId` chain terminates
 * instead of looping.
 */
export function computePagePath(project: PublicProject, page: PublicPage): string[] {
  const segments: string[] = [];
  const seen = new Set<string>();
  let current: PublicPage | undefined = page;
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    segments.unshift(current.slug);
    current = current.parentId ? project.pages.find((p) => p.id === current!.parentId) : undefined;
  }
  return segments;
}

/**
 * Matches a `rest` path against the project's page hierarchy. The home page
 * (`project.pages[0]`) is deliberately excluded — it already has its own
 * canonical location at `/`, so it isn't also reachable via `/<its-slug>`.
 */
export function resolvePageByPath(project: PublicProject, rest: string[] | undefined): PublicPage | undefined {
  if (!rest || rest.length === 0) return undefined;
  const homeId = project.pages[0]?.id;
  return project.pages.find((p) => {
    if (p.id === homeId) return false;
    const path = computePagePath(project, p);
    return path.length === rest.length && path.every((seg, i) => seg === rest[i]);
  });
}

/**
 * Phase 3 §9.2 — "Dynamic CMS pages": matches a `/<pathPrefix>/<entry-slug>`
 * request against a page marked as a CMS template.
 *
 * Three-way result, deliberately distinct: `undefined` means `rest` isn't
 * even shaped like a template request (wrong length, or the prefix isn't a
 * known template) — the caller should fall back to normal `?slug=` page
 * picking, same as any stray deep link. `null` means the prefix *did* match
 * a real template but no matching published entry exists — that's a genuine
 * 404, not a fallback to the homepage. Otherwise, the resolved page + entry.
 */
export function resolveDynamicPage(
  project: PublicProject,
  rest: string[] | undefined,
  entries: CmsEntry[]
): { page: PublicPage; entry: CmsEntry } | null | undefined {
  if (!rest || rest.length !== 2) return undefined;
  const [prefix, entrySlug] = rest;
  const page = project.pages.find((p) => p.cmsTemplate?.pathPrefix === prefix);
  if (!page?.cmsTemplate) return undefined;
  const entry = entries.find((e) => e.collectionId === page.cmsTemplate!.collectionId && e.slug === entrySlug && e.published);
  if (!entry) return null;
  return { page, entry };
}

/** The path prefix of this project's product-detail template page, if it has one. */
export function productUrlPrefixFor(project: PublicProject): string | undefined {
  return project.pages.find((p) => p.productTemplate)?.productTemplate?.pathPrefix;
}

/** Best-effort display title for an entry — prefers a field literally named title/name. */
export function guessEntryTitle(entry: CmsEntry): string | undefined {
  const v = entry.values;
  const guess = v.title ?? v.name ?? Object.values(v)[0];
  return guess === undefined || guess === null ? undefined : String(guess);
}

/** Same three-way contract as `resolveDynamicPage`, for a product detail template (`productTemplate`). */
export function resolveDynamicProductPage(
  project: PublicProject,
  rest: string[] | undefined,
  products: Product[]
): { page: PublicPage; product: Product } | null | undefined {
  if (!rest || rest.length !== 2) return undefined;
  const [prefix, productSlug] = rest;
  const page = project.pages.find((p) => p.productTemplate?.pathPrefix === prefix);
  if (!page?.productTemplate) return undefined;
  const product = products.find((p) => p.slug === productSlug && p.status === "active");
  if (!product) return null;
  return { page, product };
}

/**
 * Tries a dynamic CMS page match, then a dynamic product page match, falls
 * back to normal `?slug=` page picking. Shared by both site route files.
 * `notFound: true` means the URL was clearly a dynamic-page request (a real
 * template's path prefix) whose entry/product doesn't exist or isn't
 * published/active — the caller should 404, not silently render the homepage.
 */
export function resolvePageAndContext(
  project: PublicProject,
  rest: string[] | undefined,
  slugParam: string | null | undefined,
  entries: CmsEntry[],
  products: Product[] = []
): { page: PublicPage | null; contextEntry: CmsEntry | null; contextProduct: Product | null; notFound: boolean } {
  const dynamicCms = resolveDynamicPage(project, rest, entries);
  if (dynamicCms === null) return { page: null, contextEntry: null, contextProduct: null, notFound: true };
  if (dynamicCms) return { page: dynamicCms.page, contextEntry: dynamicCms.entry, contextProduct: null, notFound: false };

  const dynamicProduct = resolveDynamicProductPage(project, rest, products);
  if (dynamicProduct === null) return { page: null, contextEntry: null, contextProduct: null, notFound: true };
  if (dynamicProduct) return { page: dynamicProduct.page, contextEntry: null, contextProduct: dynamicProduct.product, notFound: false };

  // Phase 5 §11.1 — a real nested page path, e.g. /services/web-design.
  const hierarchyPage = resolvePageByPath(project, rest);
  if (hierarchyPage) return { page: hierarchyPage, contextEntry: null, contextProduct: null, notFound: false };

  // A real path was requested (`rest` non-empty) but matched nothing above —
  // a genuine 404, not a silent fallback to the homepage (Phase 5 §11.4's
  // custom-404 page, and Next's default not-found(), both depend on this).
  // `?slug=` stays a separate, orthogonal legacy convention: a caller that
  // combines a stray path with a still-valid `?slug=` gets that page instead
  // of a false 404, and the bare `/` request (no `rest` at all) still lands
  // on the homepage via the plain pickActivePage(project, null) case below.
  if (rest && rest.length > 0 && !slugParam) {
    return { page: null, contextEntry: null, contextProduct: null, notFound: true };
  }

  return { page: pickActivePage(project, slugParam), contextEntry: null, contextProduct: null, notFound: false };
}

/** The real, resolvable public host for this project — its verified custom domain, else its subdomain. */
export function publicHostFor(project: PublicProject): string {
  if (project.customDomain && project.customDomainVerified) return project.customDomain;
  return `${project.slug || project._id}.${ROOT_DOMAIN}`;
}

/** `https://<real host>` (or `http://` locally) — for building absolute URLs (e.g. Stripe success/cancel redirects). */
export function publicOriginFor(project: PublicProject): string {
  const proto = IS_LOCAL_ROOT ? "http" : "https";
  return `${proto}://${publicHostFor(project)}`;
}

/**
 * Canonical URL for a page. A dynamic CMS/product page (`entrySlug` given)
 * gets its template's real path. A regular page gets its real hierarchy path
 * (Phase 5 §11.1) — `/<parent-slug>/<slug>` — which is always resolvable
 * (`resolvePageAndContext` tries it before falling back to `?slug=`), so this
 * is a genuine URL a visitor or crawler can use directly, not just a fallback
 * query-param convention anymore.
 */
export function canonicalUrlFor(project: PublicProject, page: PublicPage | null, dynamicSlug?: string): string {
  const proto = IS_LOCAL_ROOT ? "http" : "https";
  const host = publicHostFor(project);
  if (page?.cmsTemplate && dynamicSlug) {
    return `${proto}://${host}/${page.cmsTemplate.pathPrefix}/${encodeURIComponent(dynamicSlug)}`;
  }
  if (page?.productTemplate && dynamicSlug) {
    return `${proto}://${host}/${page.productTemplate.pathPrefix}/${encodeURIComponent(dynamicSlug)}`;
  }
  const isHome = !page || project.pages[0]?.id === page.id;
  if (isHome) return `${proto}://${host}`;
  const path = computePagePath(project, page).map(encodeURIComponent).join("/");
  return `${proto}://${host}/${path}`;
}

export function metadataForPage(project: PublicProject, page: PublicPage | null, contextEntry?: CmsEntry | null, contextProduct?: Product | null) {
  const entryTitle = contextEntry ? guessEntryTitle(contextEntry) : undefined;
  const title = page?.seo?.title || entryTitle || contextProduct?.name || (page ? `${page.name} · ${project.businessName}` : project.businessName);
  const description = page?.seo?.description || contextProduct?.description || project.tagline || `${project.businessName} — built with LHR Web`;
  const ogImage = page?.seo?.ogImage || contextProduct?.images?.[0]?.url;
  const canonical = canonicalUrlFor(project, page, contextEntry?.slug ?? contextProduct?.slug);

  return {
    title,
    description,
    keywords: page?.seo?.keywords,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: project.businessName,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    ...(ogImage ? { twitter: { card: "summary_large_image" as const, title, description, images: [ogImage] } } : {}),
  };
}
