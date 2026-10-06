import { notFound } from "next/navigation";
import { resolveProjectByIdentifier } from "@/lib/publicSite";
import { CheckoutCancel } from "../../../_shared/CheckoutResult";

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { project } = await resolveProjectByIdentifier(projectId);
  if (!project) notFound();
  return <CheckoutCancel continueHref={`/site/${projectId}`} />;
}
