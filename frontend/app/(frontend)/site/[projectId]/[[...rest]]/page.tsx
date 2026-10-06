import type { Metadata } from "next";
import { notFound, redirect, permanentRedirect } from "next/navigation";
import { resolveProjectByIdentifier, resolvePageAndContext, resolveRedirect, metadataForPage, fetchPublicCmsEntries, fetchPublicProducts, productUrlPrefixFor } from "@/lib/publicSite";
import PublicSiteView from "../../_shared/PublicSiteView";

// `[projectId]` is either a Mongo _id (internal "Edit Site"/dashboard preview
// links) or a project slug (real subdomain visits, rewritten here by
// middleware.ts). `[[...rest]]` absorbs several cases: a stray deep link from
// a subdomain visitor (harmless, falls back to `?slug=` picking), a dynamic
// CMS page request, a dynamic product page request, a Phase 5 nested page
// hierarchy path, and — checked first — a configured redirect.
interface RouteParams { projectId: string; rest?: string[] }

export async function generateMetadata(
  { params, searchParams }: { params: Promise<RouteParams>; searchParams: Promise<{ slug?: string }> }
): Promise<Metadata> {
  const { projectId, rest } = await params;
  const { slug } = await searchParams;
  const { project } = await resolveProjectByIdentifier(projectId);
  if (!project || resolveRedirect(project, rest)) return {};
  const [entries, { products }] = await Promise.all([fetchPublicCmsEntries(project._id), fetchPublicProducts(project._id)]);
  const { page, contextEntry, contextProduct, notFound: missing } = resolvePageAndContext(project, rest, slug, entries, products);
  if (missing && !project.notFoundPageId) return {};
  const resolvedPage = missing ? (project.pages.find((p) => p.id === project.notFoundPageId) ?? null) : page;
  return metadataForPage(project, resolvedPage, contextEntry, contextProduct);
}

export default async function SiteViewer(
  { params, searchParams }: { params: Promise<RouteParams>; searchParams: Promise<{ slug?: string }> }
) {
  const { projectId, rest } = await params;
  const { slug } = await searchParams;
  const { project, isPreview } = await resolveProjectByIdentifier(projectId);
  if (!project) notFound();

  // Real HTTP-status redirects are handled in middleware.ts (this route sits
  // below app/(frontend)/loading.tsx, whose Suspense boundary flushes a 200
  // shell before this component resolves — redirect() here can't change the
  // already-sent status). This is a same-origin fallback in case middleware's
  // fetch fails for any reason.
  const redirectMatch = resolveRedirect(project, rest);
  if (redirectMatch) {
    (redirectMatch.permanent ? permanentRedirect : redirect)(redirectMatch.destination);
  }

  const [cmsEntries, { products }] = await Promise.all([fetchPublicCmsEntries(project._id), fetchPublicProducts(project._id)]);
  const { page: activePage, contextEntry, contextProduct, notFound: missing } = resolvePageAndContext(project, rest, slug, cmsEntries, products);

  if (missing) {
    // Phase 5 §11.4 — a custom 404 page renders its own content (at HTTP 200 —
    // Next's not-found boundaries don't carry route params, so a real 404
    // status isn't available here without extra plumbing; documented tradeoff).
    const customNotFoundPage = project.notFoundPageId ? project.pages.find((p) => p.id === project.notFoundPageId) : null;
    if (!customNotFoundPage) notFound();
    return (
      <PublicSiteView
        project={project}
        activePage={customNotFoundPage}
        hrefBase={`/site/${projectId}`}
        mode={isPreview ? "preview" : "public"}
        cmsEntries={cmsEntries}
        products={products}
        productUrlPrefix={productUrlPrefixFor(project)}
      />
    );
  }

  return (
    <PublicSiteView
      project={project}
      activePage={activePage}
      hrefBase={`/site/${projectId}`}
      mode={isPreview ? "preview" : "public"}
      cmsEntries={cmsEntries}
      contextEntry={contextEntry}
      products={products}
      contextProduct={contextProduct}
      productUrlPrefix={productUrlPrefixFor(project)}
    />
  );
}
