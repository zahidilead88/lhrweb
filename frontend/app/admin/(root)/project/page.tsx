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
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            className="pl-9 pr-3 py-2 border rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-black/10"
            placeholder="Search projects…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="ml-auto">
          <Link
            href="/admin/project/add"
            className="bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors"
          >
            + Add Project
          </Link>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-gray-400 text-center mt-20">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-400 text-center mt-20">{search ? "No projects match your search." : "No projects yet."}</p>
      ) : (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 w-14"></th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Title</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden md:table-cell">Description</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden lg:table-cell">Categories</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((project) => (
                <tr key={project._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <img
                      src={`http://localhost:8000/${project.image}`}
                      alt={project.title}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium">{project.title}</td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell max-w-xs truncate">{project.shortDescription}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {(project.tags || []).length > 0 ? project.tags!.map((t) => (
                        <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t}</span>
                      )) : <span className="text-xs text-gray-300">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/project/edit/${project._id}`}
                        className="text-xs px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(project._id, project.title)}
                        className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
            {filtered.length} of {projects.length} project{projects.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}
    </div>
  );
}
