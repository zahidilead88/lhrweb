"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Project {
  _id: string;
  title: string;
  shortDescription: string;
  image: string;
  tags?: string[];
  buttonText?: string;
}

export default function ManageProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch]     = useState("");
  const [loading, setLoading]   = useState(true);

  const load = () => {
    setLoading(true);
    fetch("http://localhost:8000/api/projects")
      .then((r) => r.json())
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await fetch(`http://localhost:8000/api/projects/${id}`, { method: "DELETE" });
    setProjects((prev) => prev.filter((p) => p._id !== id));
  };

  const filtered = projects.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.shortDescription?.toLowerCase().includes(search.toLowerCase()) ||
    (p.tags || []).some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="admin-heading">Work</h1>
          <p className="admin-subtext">Showcase your best projects and case studies.</p>
        </div>
        <Link
          href="/admin/project/add"
          className="admin-button-primary"
        >
          <span className="text-lg leading-none">+</span> Add Project
        </Link>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            className="admin-input pl-11"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
          <p className="text-[13px] font-medium text-gray-400">Fetching work...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 admin-card">
          <p className="text-[13px] font-medium text-gray-400">{search ? "No projects match your search." : "No projects yet."}</p>
        </div>
      ) : (
        <div className="admin-card">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="admin-table-header">
                <th className="admin-table-th w-20"></th>
                <th className="admin-table-th">Project Details</th>
                <th className="admin-table-th hidden lg:table-cell">Categories</th>
                <th className="admin-table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((project) => (
                <tr key={project._id} className="admin-table-row">
                  <td className="admin-table-td">
                    <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm ring-1 ring-black/5">
                      <img
                        src={`http://localhost:8000/${project.image}`}
                        alt={project.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </td>
                  <td className="admin-table-td">
                    <div className="flex flex-col">
                      <span className="text-[14px] font-bold text-gray-900 group-hover:text-black transition-colors">{project.title}</span>
                      <span className="text-[12px] text-gray-400 line-clamp-1 max-w-xs">{project.shortDescription}</span>
                    </div>
                  </td>
                  <td className="admin-table-td hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1.5">
                      {(project.tags || []).length > 0 ? project.tags!.map((t) => (
                        <span key={t} className="admin-badge admin-badge-mono">{t}</span>
                      )) : <span className="text-[11px] text-gray-300">—</span>}
                    </div>
                  </td>
                  <td className="admin-table-td">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/admin/project/edit/${project._id}`}
                        className="admin-button-secondary py-2 px-4"
                      >
                        Settings
                      </Link>
                      <Link
                        href={`/admin/project/${project._id}/blocks`}
                        className="admin-button-secondary py-2 px-4 border-indigo-100 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                      >
                        Content
                      </Link>
                      <button
                        onClick={() => handleDelete(project._id, project.title)}
                        className="admin-button-danger py-2 px-4"
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-8 py-4 bg-gray-50/30 border-t border-gray-50 flex justify-between items-center">
            <p className="admin-label normal-case tracking-normal">
              Showing {filtered.length} of {projects.length} Project{projects.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
