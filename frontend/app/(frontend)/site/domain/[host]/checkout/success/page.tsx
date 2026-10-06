import { notFound } from "next/navigation";
import { resolveProjectByDomain } from "@/lib/publicSite";
import { CheckoutSuccess } from "../../../../_shared/CheckoutResult";

export default async function Page({ params }: { params: Promise<{ host: string }> }) {
  const { host } = await params;
  const project = await resolveProjectByDomain(host);
  if (!project) notFound();
  return <CheckoutSuccess businessName={project.businessName} continueHref={`/site/domain/${host}`} />;
}
