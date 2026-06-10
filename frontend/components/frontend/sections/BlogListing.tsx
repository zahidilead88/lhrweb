"use client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";

interface Blog {
  _id: string;
  title: string;
  content: string;
  thumbnail?: string;
  tags?: string[];
  createdAt?: string;
}

export default function BlogListing({ extras }: { section?: any; extras?: { blogs?: Blog[] } }) {
  const initialBlogs: Blog[] = extras?.blogs ?? [];
  const [activeCategory, setActive] = useState("all");

  const categories = useMemo(() => {
    const counts: Record<string, number> = {};
    initialBlogs.forEach((b) => {
      (b.tags || []).forEach((tag) => {
        const t = tag.trim().toLowerCase();
        if (t) counts[t] = (counts[t] || 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [initialBlogs]);

  const filtered = useMemo(() => {
    if (activeCategory === "all") return initialBlogs;
    return initialBlogs.filter((b) =>
      (b.tags || []).some((t) => t.trim().toLowerCase() === activeCategory)
    );
  }, [initialBlogs, activeCategory]);

  if (initialBlogs.length === 0) return null;

  return (
    <div className="px-6 md:px-10 lg:px-20 pb-20">
      <div className="py-10 border-b border-gray-100 mb-10">
        <div className="flex items-start gap-6">
          <div className="flex items-center gap-2 pt-1 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-black" />
            <span className="text-sm text-gray-500 whitespace-nowrap">Our Blog</span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <button
              type="button"
              onClick={() => setActive("all")}
              className={`heading text-2xl md:text-3xl font-bold transition-colors leading-none ${
                activeCategory === "all" ? "text-black" : "text-gray-300 hover:text-gray-500"
              }`}
            >
              all posts<sub className="text-sm font-normal ml-0.5">{initialBlogs.length}</sub>
            </button>
            {categories.map(([tag, count]) => (
              <button
                key={tag}
                type="button"
                onClick={() => setActive(tag)}
                className={`heading text-2xl md:text-3xl font-bold transition-colors leading-none ${
                  activeCategory === tag ? "text-black" : "text-gray-300 hover:text-gray-500"
                }`}
              >
                {tag}<sub className="text-sm font-normal ml-0.5">{count}</sub>
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-gray-400 py-20">No posts in this category yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((blog) => (
            <Link key={blog._id} href={`/blog/${blog._id}`} className="group block">
              {blog.thumbnail && (
                <div className="aspect-[16/9] rounded-2xl overflow-hidden mb-4 relative bg-gray-100">
                  <Image
                    src={`${API}/${blog.thumbnail}`}
                    alt={blog.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              )}
              {blog.tags && blog.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {blog.tags.map((t) => (
                    <span key={t} className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
              )}
              <h2 className="heading font-semibold text-lg mb-2 group-hover:underline leading-snug">{blog.title}</h2>
              <p className="text-sm text-gray-500 line-clamp-2">{blog.content}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
