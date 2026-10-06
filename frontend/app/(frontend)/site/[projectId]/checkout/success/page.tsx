import { notFound } from "next/navigation";
import { resolveProjectByIdentifier } from "@/lib/publicSite";
import { CheckoutSuccess } from "../../../_shared/CheckoutResult";

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { project } = await resolveProjectByIdentifier(projectId);
  if (!project) notFound();
  return <CheckoutSuccess businessName={project.businessName} continueHref={`/site/${projectId}`} />;
}
