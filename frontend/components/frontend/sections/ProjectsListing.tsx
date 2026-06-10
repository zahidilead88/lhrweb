"use client";
import { useState, useMemo } from "react";
import ProjectCard from "./ProjectCard";

interface Project {
  _id: string;
  image: string;
  title: string;
  shortDescription: string;
  tags?: string[];
  videoUrl?: string;
  buttonText?: string;
}

export default function ProjectsListing({ extras }: { section?: any; extras?: { projects?: Project[] } }) {
  const initialProjects: Project[] = extras?.projects ?? [];
  const [activeCategory, setActive] = useState("all");

  const categories = useMemo(() => {
    const counts: Record<string, number> = {};
    initialProjects.forEach((p) => {
      (p.tags || []).forEach((tag) => {
        const t = tag.trim().toLowerCase();
        if (t) counts[t] = (counts[t] || 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [initialProjects]);

  const filtered = useMemo(() => {
    if (activeCategory === "all") return initialProjects;
    return initialProjects.filter((p) =>
      (p.tags || []).some((t) => t.trim().toLowerCase() === activeCategory)
    );
  }, [initialProjects, activeCategory]);

  if (initialProjects.length === 0) return null;

  return (
    <div className="px-6 md:px-10 lg:px-20 pb-20">
      <div className="py-10 border-b border-gray-100 mb-10">
        <div className="flex items-start gap-6">
          <div className="flex items-center gap-2 pt-1 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-black" />
            <span className="text-sm text-gray-500 whitespace-nowrap">Our Work</span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <button
              type="button"
              onClick={() => setActive("all")}
              className={`heading text-2xl md:text-3xl font-bold transition-colors leading-none ${
                activeCategory === "all" ? "text-black" : "text-gray-300 hover:text-gray-500"
              }`}
            >
              explore all<sub className="text-sm font-normal ml-0.5">{initialProjects.length}</sub>
            </button>
            {categories.map(([tag, count]) => (
              <button
                key={tag}
                type="button"
                onClick={() => setActive(tag)}
                className={`heading text-2xl md:text-3xl font-bold transition-colors leading-none ${
                  activeCategory === tag ? "text-black" : "text-gray-300 hover:text-gray-500"
                }`}
              >
                {tag}<sub className="text-sm font-normal ml-0.5">{count}</sub>
              </button>
            ))}
          </div>
        </div>
      </div>

      <ul className="grid gap-[25px_14px] md:gap-[40px_20px] grid-cols-2 lg:grid-cols-3 items-start">
        {filtered.map((project, index) => (
          <ProjectCard key={project._id} project={project} index={index} />
        ))}
      </ul>
      {filtered.length === 0 && (
        <p className="text-center text-gray-400 py-20">No projects in this category yet.</p>
      )}
    </div>
  );
}
