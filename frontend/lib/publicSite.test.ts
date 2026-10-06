import { describe, expect, it } from "vitest";
import { pickActivePage, canonicalUrlFor, publicHostFor, metadataForPage, resolveDynamicPage, resolvePageAndContext, guessEntryTitle, computePagePath, resolvePageByPath, resolveRedirect, type PublicProject } from "./publicSite";
import type { CmsEntry } from "@/types/builder";

function makeProject(overrides: Partial<PublicProject> = {}): PublicProject {
  return {
    _id: "proj-1",
    businessName: "Acme Co",
    tagline: "We make things",
    primaryColor: "#000000",
    status: "ready",
    slug: "acme",
    pages: [
      { id: "p1", name: "Home", slug: "home", blocks: [], elements: [] },
      { id: "p2", name: "About", slug: "about", blocks: [], elements: [] },
    ],
    ...overrides,
  };
}

describe("pickActivePage", () => {
  it("returns the matching page by slug", () => {
    const project = makeProject();
    expect(pickActivePage(project, "about")?.id).toBe("p2");
  });

  it("falls back to the first page when the slug doesn't match", () => {
    const project = makeProject();
    expect(pickActivePage(project, "missing")?.id).toBe("p1");
  });

  it("falls back to the first page when no slug is given", () => {
    const project = makeProject();
    expect(pickActivePage(project, null)?.id).toBe("p1");
  });

  it("returns null for a project with no pages", () => {
    const project = makeProject({ pages: [] });
    expect(pickActivePage(project, "home")).toBeNull();
  });
});

describe("publicHostFor", () => {
  it("prefers the verified custom domain", () => {
    const project = makeProject({ customDomain: "acme.com", customDomainVerified: true });
    expect(publicHostFor(project)).toBe("acme.com");
  });

  it("ignores an unverified custom domain and falls back to the subdomain", () => {
    const project = makeProject({ customDomain: "acme.com", customDomainVerified: false });
    expect(publicHostFor(project)).toBe("acme.localhost:3000");
  });

  it("falls back to the project id when there's no slug", () => {
    const project = makeProject({ slug: undefined });
    expect(publicHostFor(project)).toBe("proj-1.localhost:3000");
  });
});

describe("canonicalUrlFor", () => {
  it("has no query string for the home (first) page", () => {
    const project = makeProject();
    expect(canonicalUrlFor(project, project.pages[0])).toBe("http://acme.localhost:3000");
  });

  it("uses a real path for every page after the first (Phase 5 page hierarchy)", () => {
    const project = makeProject();
    expect(canonicalUrlFor(project, project.pages[1])).toBe("http://acme.localhost:3000/about");
  });

  it("nests the path under a parent page's slug", () => {
    const project = makeProject({
      pages: [
        { id: "p1", name: "Home", slug: "home", blocks: [], elements: [] },
        { id: "p2", name: "Services", slug: "services", blocks: [], elements: [] },
        { id: "p3", name: "Web Design", slug: "web-design", parentId: "p2", blocks: [], elements: [] },
      ],
    });
    expect(canonicalUrlFor(project, project.pages[2])).toBe("http://acme.localhost:3000/services/web-design");
  });

  it("treats a null page as the home page", () => {
    const project = makeProject();
    expect(canonicalUrlFor(project, null)).toBe("http://acme.localhost:3000");
  });
});

describe("metadataForPage", () => {
  it("falls back to page name + business name when there's no SEO title", () => {
    const project = makeProject();
    const meta = metadataForPage(project, project.pages[1]);
    expect(meta.title).toBe("About · Acme Co");
    expect(meta.description).toBe("We make things");
    expect(meta.alternates.canonical).toBe("http://acme.localhost:3000/about");
  });

  it("prefers page-level SEO fields when present", () => {
    const project = makeProject({
      pages: [{ id: "p1", name: "Home", slug: "home", blocks: [], elements: [], seo: { title: "Custom Title", description: "Custom desc", ogImage: "https://x/img.jpg" } }],
    });
    const meta = metadataForPage(project, project.pages[0]);
    expect(meta.title).toBe("Custom Title");
    expect(meta.description).toBe("Custom desc");
    expect(meta.openGraph.images).toEqual([{ url: "https://x/img.jpg" }]);
    expect(meta.twitter?.card).toBe("summary_large_image");
  });

  it("omits openGraph.images and twitter when there's no OG image", () => {
    const project = makeProject();
    const meta = metadataForPage(project, project.pages[0]);
    expect(meta.openGraph).not.toHaveProperty("images");
    expect(meta).not.toHaveProperty("twitter");
  });

  it("falls back to the entry's guessed title for a dynamic CMS page with no page-level SEO", () => {
    const project = makeProject();
    const entry: CmsEntry = { _id: "e1", collectionId: "col-1", slug: "hello-world", values: { title: "Hello World" }, published: true, order: 0 };
    const meta = metadataForPage(project, project.pages[0], entry);
    expect(meta.title).toBe("Hello World");
  });
});

describe("resolveDynamicPage", () => {
  const templatePage = { id: "p3", name: "Blog Post", slug: "blog-post", blocks: [], elements: [], cmsTemplate: { collectionId: "col-1", pathPrefix: "blog" } };
  const entries: CmsEntry[] = [
    { _id: "e1", collectionId: "col-1", slug: "hello-world", values: { title: "Hello World" }, published: true, order: 0 },
    { _id: "e2", collectionId: "col-1", slug: "draft-post", values: { title: "Draft" }, published: false, order: 1 },
  ];

  it("matches a /<pathPrefix>/<entry-slug> path to its template page and entry", () => {
    const project = makeProject({ pages: [templatePage] });
    const result = resolveDynamicPage(project, ["blog", "hello-world"], entries);
    expect(result?.page.id).toBe("p3");
    expect(result?.entry._id).toBe("e1");
  });

  it("returns undefined (not a template request) when the prefix doesn't match any template page", () => {
    const project = makeProject({ pages: [templatePage] });
    expect(resolveDynamicPage(project, ["nope", "hello-world"], entries)).toBeUndefined();
  });

  it("returns null (a genuine 404, not a fallback) for an unpublished entry under a real template prefix", () => {
    const project = makeProject({ pages: [templatePage] });
    expect(resolveDynamicPage(project, ["blog", "draft-post"], entries)).toBeNull();
  });

  it("returns null for a nonexistent entry slug under a real template prefix", () => {
    const project = makeProject({ pages: [templatePage] });
    expect(resolveDynamicPage(project, ["blog", "does-not-exist"], entries)).toBeNull();
  });

  it("returns undefined when rest isn't exactly [prefix, slug]", () => {
    const project = makeProject({ pages: [templatePage] });
    expect(resolveDynamicPage(project, ["blog"], entries)).toBeUndefined();
    expect(resolveDynamicPage(project, undefined, entries)).toBeUndefined();
  });
});

describe("resolvePageAndContext", () => {
  const templatePage = { id: "p3", name: "Blog Post", slug: "blog-post", blocks: [], elements: [], cmsTemplate: { collectionId: "col-1", pathPrefix: "blog" } };
  const homePage = { id: "p1", name: "Home", slug: "home", blocks: [], elements: [] };
  const entries: CmsEntry[] = [
    { _id: "e1", collectionId: "col-1", slug: "hello-world", values: { title: "Hello World" }, published: true, order: 0 },
  ];

  it("resolves the dynamic template + entry when the path matches", () => {
    const project = makeProject({ pages: [homePage, templatePage] });
    const result = resolvePageAndContext(project, ["blog", "hello-world"], null, entries);
    expect(result.notFound).toBe(false);
    expect(result.page?.id).toBe("p3");
    expect(result.contextEntry?._id).toBe("e1");
  });

  it("flags notFound for a real template prefix with a missing entry, instead of falling back to the homepage", () => {
    const project = makeProject({ pages: [homePage, templatePage] });
    const result = resolvePageAndContext(project, ["blog", "nonexistent"], null, entries);
    expect(result.notFound).toBe(true);
    expect(result.page).toBeNull();
  });

  it("flags notFound for a stray path that matches no template, hierarchy page, or CMS/product prefix", () => {
    const project = makeProject({ pages: [homePage, templatePage] });
    const result = resolvePageAndContext(project, ["something", "random"], null, entries);
    expect(result.notFound).toBe(true);
    expect(result.page).toBeNull();
  });

  it("still honors a legacy ?slug= even alongside a stray, unmatched path", () => {
    const project = makeProject({ pages: [homePage, templatePage] });
    const result = resolvePageAndContext(project, ["something", "random"], "home", entries);
    expect(result.notFound).toBe(false);
    expect(result.page?.id).toBe("p1");
  });

  it("resolves the homepage for the bare root (no rest path at all)", () => {
    const project = makeProject({ pages: [homePage, templatePage] });
    const result = resolvePageAndContext(project, undefined, null, entries);
    expect(result.notFound).toBe(false);
    expect(result.page?.id).toBe("p1");
  });

  it("resolves a nested page hierarchy path (Phase 5)", () => {
    const servicesPage = { id: "p4", name: "Services", slug: "services", blocks: [], elements: [] };
    const webDesignPage = { id: "p5", name: "Web Design", slug: "web-design", parentId: "p4", blocks: [], elements: [] };
    const project = makeProject({ pages: [homePage, servicesPage, webDesignPage] });
    const result = resolvePageAndContext(project, ["services", "web-design"], null, []);
    expect(result.notFound).toBe(false);
    expect(result.page?.id).toBe("p5");
  });
});

describe("computePagePath / resolvePageByPath", () => {
  const home = { id: "p1", name: "Home", slug: "home", blocks: [], elements: [] };
  const services = { id: "p2", name: "Services", slug: "services", blocks: [], elements: [] };
  const webDesign = { id: "p3", name: "Web Design", slug: "web-design", parentId: "p2", blocks: [], elements: [] };

  it("computes a root-first path through parents", () => {
    const project = makeProject({ pages: [home, services, webDesign] });
    expect(computePagePath(project, webDesign)).toEqual(["services", "web-design"]);
    expect(computePagePath(project, services)).toEqual(["services"]);
  });

  it("terminates on a circular parentId chain instead of looping", () => {
    const a = { id: "a", name: "A", slug: "a", parentId: "b", blocks: [], elements: [] };
    const b = { id: "b", name: "B", slug: "b", parentId: "a", blocks: [], elements: [] };
    const project = makeProject({ pages: [home, a, b] });
    expect(computePagePath(project, a)).toEqual(["b", "a"]);
  });

  it("excludes the home page from path resolution — only reachable at the root", () => {
    const project = makeProject({ pages: [home, services, webDesign] });
    expect(resolvePageByPath(project, ["home"])).toBeUndefined();
  });

  it("resolves a matching nested path and rejects a non-matching one", () => {
    const project = makeProject({ pages: [home, services, webDesign] });
    expect(resolvePageByPath(project, ["services", "web-design"])?.id).toBe("p3");
    expect(resolvePageByPath(project, ["services"])?.id).toBe("p2");
    expect(resolvePageByPath(project, ["services", "seo"])).toBeUndefined();
    expect(resolvePageByPath(project, undefined)).toBeUndefined();
  });
});

describe("guessEntryTitle", () => {
  it("prefers a field named title", () => {
    expect(guessEntryTitle({ _id: "1", collectionId: "c", slug: "s", values: { name: "N", title: "T" }, published: true, order: 0 })).toBe("T");
  });

  it("falls back to name, then the first value", () => {
    expect(guessEntryTitle({ _id: "1", collectionId: "c", slug: "s", values: { name: "N" }, published: true, order: 0 })).toBe("N");
    expect(guessEntryTitle({ _id: "1", collectionId: "c", slug: "s", values: { anything: "X" }, published: true, order: 0 })).toBe("X");
  });
});

describe("resolveRedirect", () => {
  it("matches an enabled redirect by real path and maps statusCode to permanent", () => {
    const project = makeProject({ redirects: [{ id: "r1", source: "/old-page", destination: "/new-page", statusCode: 301, enabled: true }] });
    expect(resolveRedirect(project, ["old-page"])).toEqual({ destination: "/new-page", permanent: true });
  });

  it("maps 302 to a non-permanent redirect", () => {
    const project = makeProject({ redirects: [{ id: "r1", source: "/temp", destination: "/dest", statusCode: 302, enabled: true }] });
    expect(resolveRedirect(project, ["temp"])?.permanent).toBe(false);
  });

  it("ignores a disabled redirect", () => {
    const project = makeProject({ redirects: [{ id: "r1", source: "/old-page", destination: "/new-page", statusCode: 301, enabled: false }] });
    expect(resolveRedirect(project, ["old-page"])).toBeNull();
  });

  it("ignores trailing slashes on both sides", () => {
    const project = makeProject({ redirects: [{ id: "r1", source: "/old-page/", destination: "/new-page", statusCode: 301, enabled: true }] });
    expect(resolveRedirect(project, ["old-page"])).toEqual({ destination: "/new-page", permanent: true });
  });

  it("matches a root-path redirect", () => {
    const project = makeProject({ redirects: [{ id: "r1", source: "/", destination: "/new-home", statusCode: 301, enabled: true }] });
    expect(resolveRedirect(project, undefined)).toEqual({ destination: "/new-home", permanent: true });
  });

  it("returns null when nothing matches or no redirects exist", () => {
    const project = makeProject();
    expect(resolveRedirect(project, ["nope"])).toBeNull();
  });
});
