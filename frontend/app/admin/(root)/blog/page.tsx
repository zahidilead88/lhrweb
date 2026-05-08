"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Blog {
  _id: string;
  title: string;
  content: string;
  thumbnail?: string;
  tags?: string[];
  createdAt?: string;
}

export default function ManageBlogsPage() {
  const [blogs, setBlogs]     = useState<Blog[]>([]);
  const [search, setSearch]   = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch("http://localhost:8000/api/blogs")
      .then((r) => r.json())
      .then((data) => setBlogs(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    const res = await fetch(`http://localhost:8000/api/blogs/${id}`, { method: "DELETE" });
    if (res.ok) setBlogs((prev) => prev.filter((b) => b._id !== id));
  };

  const filtered = blogs.filter((b) =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.content?.toLowerCase().includes(search.toLowerCase()) ||
    (b.tags || []).some((t) => t.toLowerCase().includes(search.toLowerCase()))
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
            placeholder="Search blogs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="ml-auto">
          <Link
            href="/admin/blog/add"
            className="bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors"
          >
            + Add Blog Post
          </Link>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-gray-400 text-center mt-20">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-400 text-center mt-20">{search ? "No posts match your search." : "No blog posts yet."}</p>
      ) : (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 w-14"></th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Title</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden md:table-cell">Excerpt</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden lg:table-cell">Categories</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden xl:table-cell">Date</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((blog) => (
                <tr key={blog._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    {blog.thumbnail ? (
                      <img
                        src={`http://localhost:8000/${blog.thumbnail}`}
                        alt={blog.title}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 text-lg font-bold">
                        B
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{blog.title}</td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell max-w-xs truncate">{blog.content}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {(blog.tags || []).length > 0 ? blog.tags!.map((t) => (
                        <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t}</span>
                      )) : <span className="text-xs text-gray-300">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400 hidden xl:table-cell whitespace-nowrap">
                    {blog.createdAt ? new Date(blog.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/blog/edit/${blog._id}`}
                        className="text-xs px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(blog._id, blog.title)}
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
            {filtered.length} of {blogs.length} post{blogs.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}
    </div>
  );
}
