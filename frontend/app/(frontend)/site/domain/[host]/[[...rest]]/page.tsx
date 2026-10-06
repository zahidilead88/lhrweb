import type { Metadata } from "next";
import { notFound, redirect, permanentRedirect } from "next/navigation";
import { resolveProjectByDomain, resolvePageAndContext, resolveRedirect, metadataForPage, fetchPublicCmsEntries, fetchPublicProducts, productUrlPrefixFor } from "@/lib/publicSite";
import PublicSiteView from "../../../_shared/PublicSiteView";

// Every verified custom-domain visit is rewritten here by middleware.ts
// (`/site/domain/<host>...`). `[[...rest]]` also carries a dynamic CMS page
// request, a dynamic product page request, a Phase 5 nested page hierarchy
// path, and — checked first — a configured redirect.
interface RouteParams { host: string; rest?: string[] }

export async function generateMetadata(
  { params, searchParams }: { params: Promise<RouteParams>; searchParams: Promise<{ slug?: string }> }
): Promise<Metadata> {
  const { host, rest } = await params;
  const { slug } = await searchParams;
  const project = await resolveProjectByDomain(host);
  if (!project || resolveRedirect(project, rest)) return {};
  const [entries, { products }] = await Promise.all([fetchPublicCmsEntries(project._id), fetchPublicProducts(project._id)]);
  const { page, contextEntry, contextProduct, notFound: missing } = resolvePageAndContext(project, rest, slug, entries, products);
  if (missing && !project.notFoundPageId) return {};
  const resolvedPage = missing ? (project.pages.find((p) => p.id === project.notFoundPageId) ?? null) : page;
  return metadataForPage(project, resolvedPage, contextEntry, contextProduct);
}

export default async function CustomDomainSiteViewer(
  { params, searchParams }: { params: Promise<RouteParams>; searchParams: Promise<{ slug?: string }> }
) {
  const { host, rest } = await params;
  const { slug } = await searchParams;
  const project = await resolveProjectByDomain(host);
  if (!project) notFound();

  const redirectMatch = resolveRedirect(project, rest);
  if (redirectMatch) {
    (redirectMatch.permanent ? permanentRedirect : redirect)(redirectMatch.destination);
  }

  const [cmsEntries, { products }] = await Promise.all([fetchPublicCmsEntries(project._id), fetchPublicProducts(project._id)]);
  const { page: activePage, contextEntry, contextProduct, notFound: missing } = resolvePageAndContext(project, rest, slug, cmsEntries, products);

  if (missing) {
    const customNotFoundPage = project.notFoundPageId ? project.pages.find((p) => p.id === project.notFoundPageId) : null;
    if (!customNotFoundPage) notFound();
    return (
      <PublicSiteView
        project={project}
        activePage={customNotFoundPage}
        hrefBase={`/site/domain/${host}`}
        mode="public"
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
      hrefBase={`/site/domain/${host}`}
      mode="public"
      cmsEntries={cmsEntries}
      contextEntry={contextEntry}
      products={products}
      contextProduct={contextProduct}
      productUrlPrefix={productUrlPrefixFor(project)}
    />
  );
}
