import { notFound } from "next/navigation";
import { resolveProjectByDomain } from "@/lib/publicSite";
import { CheckoutCancel } from "../../../../_shared/CheckoutResult";

export default async function Page({ params }: { params: Promise<{ host: string }> }) {
  const { host } = await params;
  const project = await resolveProjectByDomain(host);
  if (!project) notFound();
  return <CheckoutCancel continueHref={`/site/domain/${host}`} />;
}
