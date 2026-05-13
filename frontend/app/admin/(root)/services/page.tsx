"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Service {
  _id: string;
  slug: string;
  label: string;
  headline: string;
  packages: { name: string }[];
}

export default function ServicesAdminPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading]   = useState(true);

  const load = () => {
    setLoading(true);
    fetch("http://localhost:8000/api/services")
      .then((r) => r.json())
      .then((d) => setServices(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`Delete "${label}"? This cannot be undone.`)) return;
    await fetch(`http://localhost:8000/api/services/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="admin-heading">Offerings</h1>
          <p className="admin-subtext">
            Manage your core services, including pricing plans and marketing headlines.
          </p>
        </div>
        <Link
          href="/admin/services/add"
          className="admin-button-primary"
        >
          <span className="text-lg leading-none">+</span> Add Service
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
          <p className="text-[13px] font-medium text-gray-400">Synchronizing offerings...</p>
        </div>
      ) : services.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 admin-card">
          <p className="text-[13px] font-medium text-gray-400 mb-4">No services cataloged yet.</p>
          <Link
            href="/admin/services/add"
            className="text-[12px] font-bold text-black border-b border-black pb-0.5 hover:opacity-70 transition-opacity"
          >
            Create first service
          </Link>
        </div>
      ) : (
        <div className="admin-card">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="admin-table-header">
                <th className="admin-table-th">Service Label</th>
                <th className="admin-table-th">URL Segment</th>
                <th className="admin-table-th hidden md:table-cell">Headline</th>
                <th className="admin-table-th hidden lg:table-cell">Plans</th>
                <th className="admin-table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {services.map((s) => (
                <tr key={s._id} className="admin-table-row">
                  <td className="admin-table-td">
                    <span className="text-[14px] font-bold text-gray-900 group-hover:text-black transition-colors">{s.label}</span>
                  </td>
                  <td className="admin-table-td">
                    <span className="admin-badge admin-badge-mono">/services/{s.slug}</span>
                  </td>
                  <td className="admin-table-td hidden md:table-cell">
                    <p className="text-[13px] text-gray-500 max-w-xs truncate">{s.headline}</p>
                  </td>
                  <td className="admin-table-td hidden lg:table-cell">
                    <span className="text-[12px] font-bold text-gray-400">{s.packages?.length ?? 0} active tiers</span>
                  </td>
                  <td className="admin-table-td">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/admin/services/edit/${s._id}`}
                        className="admin-button-secondary py-2 px-4"
                      >
                        Details
                      </Link>
                      <button
                        onClick={() => handleDelete(s._id, s.label)}
                        className="admin-button-danger py-2 px-4"
                      >
                        Archive
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-8 py-4 bg-gray-50/30 border-t border-gray-50">
            <p className="admin-label normal-case tracking-normal">
              Cataloging <span className="text-black">{services.length}</span> individual service modules
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
