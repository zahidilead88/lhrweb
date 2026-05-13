"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import type { SectionExtras } from "../SectionRenderer";

interface Project {
  _id: string;
  title: string;
  shortDescription?: string;
  image?: string;
  tags?: string[];
}

export default function FeaturedProjects({ section, extras }: { section: any; extras?: SectionExtras }) {
  const selectedIds: string[] = (section?.accordion || []).map((a: any) => a.content).filter(Boolean);
  const allProjects = (extras?.projects ?? []) as Project[];
  
  const projects = selectedIds.length
    ? selectedIds.map((id) => allProjects.find((p) => p._id === id)).filter(Boolean) as Project[]
    : allProjects.slice(0, 3); // Fallback to first 3 if none selected

  if (!section || projects.length === 0) return null;

  return (
    <section className="px-6 md:px-10 lg:px-20 py-24 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            {section.shortDescription && (
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">
                {section.shortDescription}
              </p>
            )}
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 leading-[1.1]">
              {section.title || "Featured Work"}
            </h2>
          </div>
          <Link 
            href="/projects" 
            className="group flex items-center gap-3 text-[13px] font-bold uppercase tracking-widest text-gray-900"
          >
            Explore all cases
            <span className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center group-hover:bg-black group-hover:border-black group-hover:text-white transition-all duration-300">
              →
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
          {projects.map((project, idx) => (
            <Link 
              key={project._id} 
              href={`/projects/${project._id}`}
              className={`group block space-y-6 ${idx % 2 === 1 ? "md:mt-24" : ""}`}
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-[2.5rem] bg-gray-50">
                {project.image && (
                  <Image
                    src={`http://localhost:8000/${project.image}`}
                    alt={project.title}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-500" />
              </div>
              
              <div className="space-y-3 px-2">
                <div className="flex flex-wrap gap-2">
                  {project.tags?.slice(0, 2).map((tag, i) => (
                    <span key={i} className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      {tag}
                    </span>
                  ))}
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 group-hover:text-gray-600 transition-colors">
                  {project.title}
                </h3>
                {project.shortDescription && (
                  <p className="text-gray-500 text-[15px] leading-relaxed line-clamp-2 max-w-md">
                    {project.shortDescription}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
