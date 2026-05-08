"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Counts {
  pages: number;
  blogs: number;
  projects: number;
  sections: number;
}

export default function AdminDashboard() {
  const [counts, setCounts] = useState<Counts>({ pages: 0, blogs: 0, projects: 0, sections: 0 });

  useEffect(() => {
    Promise.all([
      fetch("http://localhost:8000/api/pages").then((r) => r.json()),
      fetch("http://localhost:8000/api/blogs").then((r) => r.json()),
      fetch("http://localhost:8000/api/projects").then((r) => r.json()),
      fetch("http://localhost:8000/api/sections").then((r) => r.json()),
    ])
      .then(([pages, blogs, projects, sections]) => {
        setCounts({
          pages:    Array.isArray(pages)    ? pages.length    : 0,
          blogs:    Array.isArray(blogs)    ? blogs.length    : 0,
          projects: Array.isArray(projects) ? projects.length : 0,
          sections: Array.isArray(sections) ? sections.length : 0,
        });
      })
      .catch(() => {});
  }, []);

  const cards = [
    {
      label:   "Pages",
      count:   counts.pages,
      addHref: "/admin/pages",
      addLabel: "Manage Pages",
      bg:      "bg-blue-50",
      border:  "border-blue-200",
      text:    "text-blue-700",
      num:     "text-blue-600",
    },
    {
      label:   "Sections",
      count:   counts.sections,
      addHref: "/admin/sections/add",
      addLabel: "Add Section",
      bg:      "bg-purple-50",
      border:  "border-purple-200",
      text:    "text-purple-700",
      num:     "text-purple-600",
    },
    {
      label:   "Projects",
      count:   counts.projects,
      addHref: "/admin/project/add",
      addLabel: "Add Project",
      bg:      "bg-green-50",
      border:  "border-green-200",
      text:    "text-green-700",
      num:     "text-green-600",
    },
    {
      label:   "Blog Posts",
      count:   counts.blogs,
      addHref: "/admin/blog/add",
      addLabel: "Add Blog Post",
      bg:      "bg-orange-50",
      border:  "border-orange-200",
      text:    "text-orange-700",
      num:     "text-orange-600",
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome to the admin panel.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`rounded-2xl border ${card.border} ${card.bg} p-6 flex flex-col gap-4`}
          >
            <div>
              <p className={`text-sm font-medium ${card.text} mb-1`}>{card.label}</p>
              <p className={`text-5xl font-bold ${card.num}`}>{card.count}</p>
            </div>
            <Link
              href={card.addHref}
              className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold bg-white border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors text-gray-700 w-fit"
            >
              <span>+</span> {card.addLabel}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
