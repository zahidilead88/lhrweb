"use client";

// Phase 1 (docs/BLUEPRINT.md) — the actual live-site renderer, shared by both
// public entry points: /site/[projectId] (internal preview, by Mongo _id, and
// subdomain visits, by project slug) and /site/domain/[host] (verified custom
// domains). Renders through the same pipeline the builder editor uses
// (generateHTML/generateCSS) instead of the legacy blocks-only viewer.

import { useState } from "react";
import Link from "next/link";
import { LayoutDashboard, ExternalLink, Menu, X } from "lucide-react";
import BlockPreview from "@/app/builder/_components/BlockPreview";
import { generateHTML } from "@/lib/generateHTML";
import { generateCSS } from "@/lib/generateCSS";
import { resolveCmsBindings } from "@/lib/resolveCmsBindings";
import { resolveProductBindings } from "@/lib/resolveProductBindings";
import { publicOriginFor, computePagePath, type PublicPage, type PublicProject } from "@/lib/publicSite";
import type { CmsEntry, Product, Menu as SiteMenu, MenuItem } from "@/types/builder";
import CartWidget from "./CartWidget";
import FormSubmitHandler from "./FormSubmitHandler";
import AnalyticsTracker from "./AnalyticsTracker";

// Reset only — the editor's own BASE_CSS also adds hover/selection outlines
// that must never reach a real visitor.
const LIVE_BASE_CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { font-family: system-ui, -apple-system, sans-serif; }
  a { text-decoration: none; }
  img { max-width: 100%; display: block; }
`;

export default function PublicSiteView({
  project,
  activePage,
  hrefBase,
  mode,
  cmsEntries = [],
  contextEntry = null,
  products = [],
  contextProduct = null,
  productUrlPrefix,
}: {
  project: PublicProject;
  activePage: PublicPage | null;
  /** Base path this site is served under, e.g. `/site/<id>` or `/site/domain/<host>` — page links append `?slug=`. */
  hrefBase: string;
  /** "preview" = internal, authenticated owner view (Edit Site / Dashboard links). "public" = a real visitor. */
  mode: "preview" | "public";
  /** Published CMS entries for this project — resolves any `cmsBinding`s before rendering. */
  cmsEntries?: CmsEntry[];
  /** Phase 3 — set when `activePage` is a dynamic CMS template rendering this specific entry. */
  contextEntry?: CmsEntry | null;
  /** Active products for this project — resolves `productBinding`/`productList`/`addToCart`. */
  products?: Product[];
  /** Phase 3 — set when `activePage` is a dynamic product template rendering this specific product. */
  contextProduct?: Product | null;
  /** Path prefix for product detail URLs (the page marked as `productTemplate`), if one exists. */
  productUrlPrefix?: string;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  if (!project.pages.length || !activePage) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center gap-4 text-center">
        <p className="heading text-2xl font-black text-gray-800">This site has no pages yet</p>
        <p className="text-sm text-gray-400">Open the builder to add content.</p>
      </div>
    );
  }

  const hasElements = activePage.elements && activePage.elements.length > 0;
  const cmsResolved = hasElements ? resolveCmsBindings(activePage.elements, cmsEntries, contextEntry) : activePage.elements;
  const resolvedElements = hasElements ? resolveProductBindings(cmsResolved, products, contextProduct, productUrlPrefix) : cmsResolved;
  const bodyHTML = hasElements ? generateHTML(resolvedElements, false) : "";
  const css = hasElements ? generateCSS(resolvedElements, project.classes ?? [], project.tokens) : "";

  const origin = publicOriginFor(project);
  const checkoutSuccessUrl = `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
  const checkoutCancelUrl = `${origin}/checkout/cancel`;

  // Phase 5 §11.1 — real hierarchy paths. Mode-dependent on purpose: in "public"
  // mode the browser's actual origin is the customer's own host, so a clean
  // root-relative path (e.g. "/services/web-design") is what middleware.ts's
  // subdomain/custom-domain rewrite expects — prefixing it with `hrefBase`
  // (the already-rewritten internal "/site/<id>" path) would double-rewrite
  // and silently land back on the homepage. In "preview" mode there IS no
  // subdomain to rewrite through (it's viewed on the app's own root domain),
  // so the internal `hrefBase` prefix is required instead.
  const pageHref = (page: PublicPage): string => {
    const isHome = project.pages[0]?.id === page.id;
    const path = isHome ? "" : `/${computePagePath(project, page).map(encodeURIComponent).join("/")}`;
    return mode === "preview" ? `${hrefBase}${path}` : (path || "/");
  };

  // Phase 5 §11.3 — global navigation. A configured "Header" menu (any casing)
  // replaces the default "list every page" nav; absent one, behavior is
  // unchanged from before this phase.
  type ResolvedNavItem = { key: string; label: string; href: string; external: boolean; active: boolean; children: ResolvedNavItem[] };
  const resolveMenuItem = (item: MenuItem): ResolvedNavItem => {
    const children = (item.children ?? []).filter((c) => c.visible !== false).map(resolveMenuItem);
    if (item.target.type === "url") {
      return { key: item.id, label: item.label, href: item.target.href, external: true, active: false, children };
    }
    const pageId = item.target.pageId;
    const page = project.pages.find((p) => p.id === pageId);
    return { key: item.id, label: item.label, href: page ? pageHref(page) : "#", external: false, active: !!page && page.id === activePage?.id, children };
  };
  const headerMenu = project.menus?.find((m: SiteMenu) => m.name.trim().toLowerCase() === "header");
  const navItems: ResolvedNavItem[] = headerMenu
    ? headerMenu.items.filter((i) => i.visible !== false).map(resolveMenuItem)
    : project.pages.map((page) => ({ key: page.id, label: page.name, href: pageHref(page), external: false, active: activePage?.id === page.id, children: [] }));

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col overflow-hidden" data-lhrweb-page-id={activePage?.id ?? ""}>
      {mode === "preview" && (
        <div className="bg-slate-900 text-white px-4 py-2 flex items-center justify-between shrink-0 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-indigo-600 rounded flex items-center justify-center">
              <LayoutDashboard className="w-3 h-3" />
            </div>
            <span className="text-slate-400">Powered by <span className="text-white font-bold">LHR Web</span></span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/builder?projectId=${project._id}`}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-full font-bold transition-all"
            >
              Edit Site
              <ExternalLink className="w-3 h-3" />
            </Link>
            <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors font-medium">
              Dashboard
            </Link>
          </div>
        </div>
      )}

      {/* ── Site nav bar ── */}
      <nav
        className="shrink-0 border-b border-gray-100 bg-white px-6 py-3 flex items-center justify-between"
        style={{ borderBottomColor: `${project.primaryColor}22` }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black"
            style={{ backgroundColor: project.primaryColor || "#000" }}
          >
            {project.businessName?.[0]?.toUpperCase() ?? "W"}
          </div>
          <span className="font-black text-gray-900 text-sm">{project.businessName}</span>
        </div>

        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <div key={item.key} className="relative group">
              <Link
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  item.active ? "text-white" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
                style={item.active ? { backgroundColor: project.primaryColor } : {}}
              >
                {item.label}
              </Link>
              {item.children.length > 0 && (
                <div className="absolute left-0 top-full hidden group-hover:block bg-white border border-gray-100 rounded-xl shadow-lg py-1.5 min-w-[160px] z-10">
                  {item.children.map((child) => (
                    <Link
                      key={child.key}
                      href={child.href}
                      target={child.external ? "_blank" : undefined}
                      rel={child.external ? "noopener noreferrer" : undefined}
                      className="block px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 whitespace-nowrap"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
          onClick={() => setMobileNavOpen((o) => !o)}
        >
          {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {mobileNavOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 px-4 py-2 shrink-0">
          {navItems.map((item) => (
            <div key={item.key} className="mb-1">
              <Link
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                onClick={() => setMobileNavOpen(false)}
                className={`block px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  item.active ? "text-white" : "text-gray-600 hover:bg-gray-50"
                }`}
                style={item.active ? { backgroundColor: project.primaryColor } : {}}
              >
                {item.label}
              </Link>
              {item.children.map((child) => (
                <Link
                  key={child.key}
                  href={child.href}
                  target={child.external ? "_blank" : undefined}
                  rel={child.external ? "noopener noreferrer" : undefined}
                  onClick={() => setMobileNavOpen(false)}
                  className="block pl-8 pr-4 py-2 rounded-xl text-[13px] font-medium text-gray-500 hover:bg-gray-50"
                >
                  {child.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ── Page content ── */}
      <div className="flex-1 overflow-y-auto">
        {hasElements ? (
          <>
            <style dangerouslySetInnerHTML={{ __html: LIVE_BASE_CSS + css }} />
            <div dangerouslySetInnerHTML={{ __html: bodyHTML }} />
          </>
        ) : activePage.blocks.length > 0 ? (
          <BlockPreview blocks={activePage.blocks} primaryColor={project.primaryColor} />
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
            <p className="text-4xl">🖼️</p>
            <p className="text-lg font-bold text-gray-700">This page is empty</p>
            {mode === "preview" && (
              <>
                <p className="text-sm text-gray-400">Open the builder to add content to this page.</p>
                <Link
                  href={`/builder?projectId=${project._id}&pageId=${activePage.id}`}
                  className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all mt-2"
                >
                  Open Builder
                </Link>
              </>
            )}
          </div>
        )}
      </div>

      {mode === "public" && (
        <CartWidget
          projectId={project._id}
          primaryColor={project.primaryColor}
          products={products}
          successUrl={checkoutSuccessUrl}
          cancelUrl={checkoutCancelUrl}
        />
      )}

      <FormSubmitHandler projectId={project._id} />

      {mode === "public" && <AnalyticsTracker projectId={project._id} pageKey={activePage?.id ?? ""} />}
    </div>
  );
}
