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
    <div className="space-y-6">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="admin-heading">Structure</h1>
          <p className="admin-subtext">
            Organize page layouts by managing their content sections and rendering order.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`http://localhost:3000/${activePage === "home" ? "" : activePage}`}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] font-bold text-gray-400 hover:text-black uppercase tracking-widest transition-colors mr-4"
          >
            Live Preview ↗
          </a>
          <Link
            href={`/admin/sections/add?page=${activePage}`}
            className="admin-button-primary"
          >
            <span className="text-lg leading-none">+</span> Add Section
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-3 bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
          {pages.slice(0, 5).map((p) => (
            <button
              key={p.slug}
              onClick={() => setActivePage(p.slug)}
              className={`px-5 py-2 rounded-xl text-[12px] font-bold transition-all ${
                activePage === p.slug 
                  ? "bg-black text-white shadow-md" 
                  : "text-gray-400 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {p.name}
            </button>
          ))}
          {pages.length > 5 && (
            <select
              value={activePage}
              onChange={(e) => setActivePage(e.target.value)}
              className="px-4 py-2 bg-gray-50 text-gray-600 rounded-xl text-[12px] font-bold border-0 focus:ring-0 cursor-pointer"
            >
              <option disabled>More Pages...</option>
              {pages.slice(5).map((p) => (
                <option key={p.slug} value={p.slug}>{p.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-[13px] text-red-600 font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
          <p className="text-[13px] font-medium text-gray-400">Loading layout structure...</p>
        </div>
      ) : sections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 admin-card">
          <p className="text-[13px] font-medium text-gray-400 mb-4">No sections defined for this page yet.</p>
          <Link
            href={`/admin/sections/add?page=${activePage}`}
            className="text-[12px] font-bold text-black border-b border-black pb-0.5 hover:opacity-70 transition-opacity"
          >
            Create first section
          </Link>
        </div>
      ) : (
        <div className="admin-card">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="admin-table-header">
                <th className="admin-table-th">Section Details</th>
                <th className="admin-table-th">Type</th>
                <th className="admin-table-th text-center">Order</th>
                <th className="admin-table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sections.map((section) => {
                const type = SECTION_TYPES_BY_KEY[section.key];
                return (
                  <tr key={section._id} className="admin-table-row">
                    <td className="admin-table-td">
                      <span className="text-[14px] font-bold text-gray-900 group-hover:text-black transition-colors">{section.name}</span>
                    </td>
                    <td className="admin-table-td">
                      <div className="flex flex-col gap-1">
                        <span className="admin-badge admin-badge-mono">
                          {section.key}
                        </span>
                        {type && (
                          <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider ml-1">{type.label}</span>
                        )}
                      </div>
                    </td>
                    <td className="admin-table-td text-center">
                      <span className="text-[12px] font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">#{section.order ?? 0}</span>
                    </td>
                    <td className="admin-table-td">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/admin/sections/${section._id}/edit`}
                          className="admin-button-secondary py-2 px-4"
                        >
                          Config
                        </Link>
                        <button
                          onClick={() => handleDelete(section._id, section.name)}
                          className="admin-button-danger py-2 px-4"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-8 py-4 bg-gray-50/30 border-t border-gray-50">
            <p className="admin-label normal-case tracking-normal">
              Currently managing layout for <span className="text-black">{activeName}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
