"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Project {
  _id: string;
  title: string;
  image: string;
  shortDescription: string;
  description?: string;
  tags?: string[];
  videoUrl?: string;
  buttonText?: string;
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:8000/api/projects/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        setProject(data);
        setLoading(false);
      })
      .catch(() => {
        router.replace("/projects");
      });
  }, [id, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Back link */}
      <div className="px-6 md:px-10 lg:px-20 pt-10">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Link>
      </div>

      {/* Hero */}
      <section className="px-6 md:px-10 lg:px-20 pt-10 pb-16">
        <div className="flex flex-wrap gap-2 mb-4">
          {project.tags?.map((tag) => (
            <span
              key={tag}
              className="text-xs font-semibold uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
        <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
          {project.title}
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl">{project.shortDescription}</p>
      </section>

      {/* Main image */}
      <div className="px-6 md:px-10 lg:px-20 mb-16">
        <div className="rounded-2xl overflow-hidden w-full aspect-[16/9] relative">
          {project.videoUrl ? (
            <video
              className="w-full h-full object-cover"
              src={`http://localhost:8000/${project.videoUrl}`}
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <Image
              src={`http://localhost:8000/${project.image}`}
              alt={project.title}
              fill
              className="object-cover"
              priority
            />
          )}
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <section className="px-6 md:px-10 lg:px-20 mb-20">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold mb-4">About this project</h2>
            <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-line">
              {project.description}
            </p>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="px-6 md:px-10 lg:px-20 pb-24 border-t border-gray-100 pt-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          Like what you see?
        </h2>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 bg-black text-white px-8 py-4 rounded-full text-lg hover:bg-gray-800 transition-colors"
        >
          Start a project
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 14 14"
            fill="none"
          >
            <path
              d="M14 4.24128V0.471254C14 0.34627 13.9503 0.226405 13.862 0.138028C13.7736 0.0496505 13.6537 7.54619e-07 13.5287 7.54619e-07L9.75872 7.54619e-07C9.66539 -0.000166225 9.57411 0.0273818 9.49646 0.0791523C9.41881 0.130923 9.35828 0.204584 9.32254 0.290799C9.2868 0.377013 9.27747 0.471897 9.29572 0.563423C9.31398 0.654948 9.35899 0.738993 9.42507 0.804902L10.9774 2.35627L0 13.3327L0.667295 14L11.6437 3.02262L13.1951 4.57493C13.261 4.64101 13.3451 4.68602 13.4366 4.70428C13.5281 4.72253 13.623 4.7132 13.7092 4.67746C13.7954 4.64172 13.8691 4.58119 13.9208 4.50354C13.9726 4.42589 14.0002 4.33461 14 4.24128Z"
              fill="white"
            />
          </svg>
        </Link>
      </section>
    </div>
  );
}
