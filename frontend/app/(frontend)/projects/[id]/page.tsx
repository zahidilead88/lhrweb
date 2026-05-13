import { Metadata } from "next";
import { notFound } from "next/navigation";
import ProjectBlockRenderer from "@/components/frontend/project/ProjectBlockRenderer";

interface Block {
  _id?: string;
  type: string;
  heading: string;
  subheading: string;
  text: string;
  images: string[];
  videoUrl: string;
  meta: Record<string, string>;
  order: number;
}

interface Project {
  _id: string;
  title: string;
  image: string;
  shortDescription: string;
  description?: string;
  tags?: string[];
  videoUrl?: string;
  buttonText?: string;
  blocks?: Block[];
}

async function fetchProject(id: string): Promise<Project | null> {
  try {
    const res = await fetch(`http://localhost:8000/api/projects/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const project = await fetchProject(id);
  if (!project) return { title: "Project Not Found" };
  return {
    title: project.title,
    description: project.shortDescription,
    openGraph: {
      title: project.title,
      description: project.shortDescription,
      images: project.image ? [`http://localhost:8000/${project.image}`] : [],
    },
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await fetchProject(id);
  if (!project) notFound();
  return <ProjectBlockRenderer project={project} />;
}
