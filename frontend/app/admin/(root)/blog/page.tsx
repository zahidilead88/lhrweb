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
    <div className="space-y-6">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="admin-heading">Journal</h1>
          <p className="admin-subtext">Manage your blog posts, articles, and news updates.</p>
        </div>
        <Link
          href="/admin/blog/add"
          className="admin-button-primary"
        >
          <span className="text-lg leading-none">+</span> Add Post
        </Link>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            className="admin-input pl-11"
            placeholder="Search posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
          <p className="text-[13px] font-medium text-gray-400">Fetching articles...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 admin-card">
          <p className="text-[13px] font-medium text-gray-400">{search ? "No posts match your search." : "No blog posts yet."}</p>
        </div>
      ) : (
        <div className="admin-card">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="admin-table-header">
                <th className="admin-table-th w-20"></th>
                <th className="admin-table-th">Article Details</th>
                <th className="admin-table-th hidden lg:table-cell">Categories</th>
                <th className="admin-table-th hidden xl:table-cell">Date</th>
                <th className="admin-table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((blog) => (
                <tr key={blog._id} className="admin-table-row">
                  <td className="admin-table-td">
                    {blog.thumbnail ? (
                      <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm ring-1 ring-black/5">
                        <img
                          src={`http://localhost:8000/${blog.thumbnail}`}
                          alt={blog.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-300 text-lg font-bold">
                        B
                      </div>
                    )}
                  </td>
                  <td className="admin-table-td">
                    <div className="flex flex-col">
                      <span className="text-[14px] font-bold text-gray-900 group-hover:text-black transition-colors">{blog.title}</span>
                      <span className="text-[12px] text-gray-400 line-clamp-1 max-w-xs">{blog.content}</span>
                    </div>
                  </td>
                  <td className="admin-table-td hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1.5">
                      {(blog.tags || []).length > 0 ? blog.tags!.map((t) => (
                        <span key={t} className="admin-badge admin-badge-mono">{t}</span>
                      )) : <span className="text-[11px] text-gray-300">—</span>}
                    </div>
                  </td>
                  <td className="admin-table-td text-gray-400 hidden xl:table-cell">
                    <span className="text-[12px] font-medium">
                      {blog.createdAt ? new Date(blog.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                    </span>
                  </td>
                  <td className="admin-table-td">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/admin/blog/edit/${blog._id}`}
                        className="admin-button-secondary py-2 px-4"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(blog._id, blog.title)}
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
              Showing {filtered.length} of {blogs.length} Post{blogs.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
