import type { Metadata } from "next";
import PageSections from "@/components/frontend/PageSections";
import BlockRenderer from "@/components/frontend/BlockRenderer";

async function fetchPage() {
  try {
    const res = await fetch("http://localhost:8000/api/pages/home", { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchPage();
  return {
    title:       page?.seoTitle       || "LHRWEB — Digital Agency",
    description: page?.seoDescription || undefined,
    keywords:    page?.keywords        || undefined,
    openGraph: {
      title:       page?.ogTitle       || page?.seoTitle       || "LHRWEB",
      description: page?.ogDescription || page?.seoDescription || undefined,
      images:      page?.ogImage ? [{ url: page.ogImage }] : undefined,
    },
    robots: page?.robotsNoIndex ? "noindex,nofollow" : "index,follow",
  };
}

export default async function HomePage() {
  const page = await fetchPage();

  return (
    <>
      {page?.schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: page.schema }}
        />
      )}
      <PageSections page="home" initialData={page ?? undefined} />
      {page?.contentSections
        ?.filter((s: any) => s.enabled !== false)
        .sort((a: any, b: any) => a.order - b.order)
        .map((s: any) => <BlockRenderer key={s._id || s.order} blocks={s.blocks} />)}
    </>
  );
}
