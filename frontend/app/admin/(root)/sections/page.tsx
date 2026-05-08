"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { SECTION_TYPES_BY_KEY } from "@/lib/sectionRegistry";

interface Section {
  _id: string;
  name: string;
  key: string;
  page: string;
  order: number;
}

const FALLBACK_PAGES = [
  { slug: "home",     name: "Home" },
  { slug: "services", name: "Services" },
  { slug: "about",    name: "About" },
  { slug: "projects", name: "Projects" },
  { slug: "contact",  name: "Contact" },
  { slug: "blog",     name: "Blog" },
];

export default function SectionsPage() {
  const [sections, setSections]     = useState<Section[]>([]);
  const [pages, setPages]           = useState(FALLBACK_PAGES);
  const [activePage, setActivePage] = useState("home");
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [secsRes, pgsRes] = await Promise.all([
        fetch(`http://localhost:8000/api/sections?page=${activePage}`),
        fetch("http://localhost:8000/api/pages"),
      ]);
      const secs = await secsRes.json();
      const pgs  = await pgsRes.json();
      setSections(Array.isArray(secs) ? secs : []);
      if (Array.isArray(pgs) && pgs.length > 0) {
        setPages(pgs.map((p: any) => ({ slug: p.slug, name: p.name })));
      }
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [activePage]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete section "${name}"? This cannot be undone.`)) return;
    await fetch(`http://localhost:8000/api/sections/${id}`, { method: "DELETE" });
    loadData();
  };

  const activeName = pages.find((p) => p.slug === activePage)?.name ?? activePage;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Sections</h1>
          <p className="text-sm text-gray-500 mt-1">
            Each section is a page-specific content block. The same component can appear on multiple pages with different data.
          </p>
        </div>
      </div>

      {/* Page selector + Add button */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600 whitespace-nowrap">Page:</label>
          <select
            value={activePage}
            onChange={(e) => setActivePage(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black/10 min-w-[160px]"
          >
            {pages.map((p) => (
              <option key={p.slug} value={p.slug}>{p.name}</option>
            ))}
          </select>
        </div>

        <Link
          href={`/admin/sections/add?page=${activePage}`}
          className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          + Add Section
        </Link>

        <a
          href={`http://localhost:3000/${activePage === "home" ? "" : activePage}`}
          target="_blank"
          rel="noreferrer"
          className="ml-auto text-xs text-gray-400 hover:text-black underline"
        >
          Preview {activeName} ↗
        </a>
      </div>

      {error && (
        <div className="mb-4 px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 mt-10 text-center">Loading sections...</p>
      ) : sections.length === 0 ? (
        <div className="mt-20 text-center text-gray-400">
          <p className="mb-3">No sections on this page yet.</p>
          <Link
            href={`/admin/sections/add?page=${activePage}`}
            className="text-blue-600 underline text-sm"
          >
            Add the first section
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Component Type</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700 w-20">Order</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sections.map((section) => {
                const type = SECTION_TYPES_BY_KEY[section.key];
                return (
                  <tr key={section._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium">{section.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <code className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 w-fit">
                          {section.key}
                        </code>
                        {type && (
                          <span className="text-xs text-gray-400">{type.label}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500">{section.order ?? 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/sections/${section._id}/edit`}
                          className="text-xs px-3 py-1.5 bg-gray-100 rounded hover:bg-gray-200 font-medium transition-colors"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(section._id, section.name)}
                          className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 font-medium transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
