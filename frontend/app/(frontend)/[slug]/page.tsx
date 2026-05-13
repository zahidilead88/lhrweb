import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PageSections from "@/components/frontend/PageSections";
import BlockRenderer from "@/components/frontend/BlockRenderer";

async function fetchPage(slug: string) {
  try {
    const res = await fetch(`http://localhost:8000/api/pages/${slug}`, { cache: "no-store" });
    console.log(res, "res");
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await fetchPage(slug);
  if (!page) return { title: "Not Found" };

  return {
    title:       page.seoTitle       || page.name,
    description: page.seoDescription || undefined,
    keywords:    page.keywords        || undefined,
    openGraph: {
      title:       page.ogTitle       || page.seoTitle       || page.name,
      description: page.ogDescription || page.seoDescription || undefined,
      images:      page.ogImage ? [{ url: page.ogImage }] : undefined,
    },
    robots: page.robotsNoIndex ? "noindex,nofollow" : "index,follow",
  };
}

export default async function DynamicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await fetchPage(slug);
  if (!page) notFound();

  return (
    <>
      {page.schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: page.schema }}
        />
      )}
      <PageSections page={slug} initialData={page} />
      {page.contentSections
        ?.filter((s: any) => s.enabled !== false)
        .sort((a: any, b: any) => a.order - b.order)
        .map((s: any) => <BlockRenderer key={s._id || s.order} blocks={s.blocks} />)}
    </>
  );
}
