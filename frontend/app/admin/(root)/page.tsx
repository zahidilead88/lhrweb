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
    <div className="space-y-8">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="admin-heading">Dashboard</h1>
          <p className="admin-subtext">Welcome back. Here's what's happening with your site today.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div
            key={card.label}
            className="group admin-card p-8 admin-card-hover flex flex-col gap-6"
          >
            <div>
              <p className="admin-label">{card.label}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold tracking-tight text-gray-900">{card.count}</span>
                <span className="text-[12px] font-bold text-gray-300">Total</span>
              </div>
            </div>
            
            <Link
              href={card.addHref}
              className="admin-button-secondary w-full group-hover:bg-gray-100"
            >
              <span>{card.addLabel}</span>
              <span className="text-lg leading-none transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>
        ))}
      </div>

      {/* Placeholder for Quick Actions or Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 admin-card p-8">
          <h3 className="text-[14px] font-bold text-gray-900 mb-6">Recent Activity</h3>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 py-4 border-b border-gray-50 last:border-0">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-bold text-gray-900">System initialization complete</p>
                  <p className="text-[11px] text-gray-400">Successfully synced with central API</p>
                </div>
                <span className="text-[11px] font-bold text-gray-300 uppercase">Just now</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-black rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-between overflow-hidden relative group">
          <div className="relative z-10">
            <h3 className="text-[14px] font-bold text-white mb-2">Need help?</h3>
            <p className="text-[12px] text-gray-400 leading-relaxed">Check out our documentation or contact support for advanced configurations.</p>
          </div>
          <Link href="#" className="relative z-10 mt-8 text-[12px] font-bold text-white flex items-center gap-2 hover:opacity-80 transition-opacity">
            Visit Help Center <span className="text-lg">→</span>
          </Link>
          
          {/* Abstract decoration */}
          <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all" />
        </div>
      </div>
    </div>
  );
}
