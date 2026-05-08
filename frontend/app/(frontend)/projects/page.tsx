"use client";

import React, { useEffect, useState, useMemo } from "react";
import ProjectCard from "@/components/frontend/home/ProjectCard";
import PageSections from "@/components/frontend/PageSections";

interface Project {
  _id: string;
  image: string;
  title: string;
  shortDescription: string;
  tags?: string[];
  videoUrl?: string;
  buttonText?: string;
}

export default function ProjectsPage() {
  const [projects, setProjects]         = useState<Project[]>([]);
  const [activeCategory, setActive]     = useState("all");

  useEffect(() => {
    fetch("http://localhost:8000/api/projects")
      .then((r) => r.json())
      .then((data: Project[]) => setProjects(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // Build category list from tags across all projects
  const categories = useMemo(() => {
    const counts: Record<string, number> = {};
    projects.forEach((p) => {
      (p.tags || []).forEach((tag) => {
        const t = tag.trim().toLowerCase();
        if (t) counts[t] = (counts[t] || 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [projects]);

  const filtered = useMemo(() => {
    if (activeCategory === "all") return projects;
    return projects.filter((p) =>
      (p.tags || []).some((t) => t.trim().toLowerCase() === activeCategory)
    );
  }, [projects, activeCategory]);

  return (
    <>
      <PageSections page="projects" />

      <div className="px-6 md:px-10 lg:px-20 pb-20">

        {/* Category filter bar */}
        {projects.length > 0 && (
          <div className="py-10 border-b border-gray-100 mb-10">
            <div className="flex items-start gap-6">
              {/* Label */}
              <div className="flex items-center gap-2 pt-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-black" />
                <span className="text-sm text-gray-500 whitespace-nowrap">Our Work</span>
              </div>

              {/* Scrollable filter tags */}
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {/* "Explore all" */}
                <button
                  type="button"
                  onClick={() => setActive("all")}
                  className={`text-2xl md:text-3xl font-bold transition-colors leading-none ${
                    activeCategory === "all" ? "text-black" : "text-gray-300 hover:text-gray-500"
                  }`}
                >
                  explore all
                  <sub className="text-sm font-normal ml-0.5">{projects.length}</sub>
                </button>

                {categories.map(([tag, count]) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setActive(tag)}
                    className={`text-2xl md:text-3xl font-bold transition-colors leading-none ${
                      activeCategory === tag ? "text-black" : "text-gray-300 hover:text-gray-500"
                    }`}
                  >
                    {tag}
                    <sub className="text-sm font-normal ml-0.5">{count}</sub>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Projects grid */}
        <section>
          <ul className="grid gap-[25px_14px] md:gap-[40px_20px] grid-cols-2 lg:grid-cols-3 items-start">
            {filtered.map((project, index) => (
              <ProjectCard key={project._id} project={project} index={index} />
            ))}
          </ul>

          {filtered.length === 0 && (
            <p className="text-center text-gray-400 py-20">No projects in this category yet.</p>
          )}
        </section>
      </div>
    </>
  );
}
