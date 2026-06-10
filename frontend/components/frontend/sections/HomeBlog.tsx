"use client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

import Link from "next/link";
import Image from "next/image";
import type { SectionExtras } from "../SectionRenderer";

interface Blog {
  _id: string;
  title: string;
  content: string;
  thumbnail?: string;
}

export default function HomeBlog({ section, extras }: { section: any; extras?: SectionExtras }) {
  const selectedIds: string[] = (section?.accordion || []).map((a: any) => a.content).filter(Boolean);
  const allBlogs = (extras?.blogs ?? []) as Blog[];
  const blogs = selectedIds.length
    ? selectedIds.map((id) => allBlogs.find((b) => b._id === id)).filter(Boolean) as Blog[]
    : allBlogs;

  if (!section || blogs.length === 0) return null;

  return (
    <section className="px-6 md:px-10 lg:px-20 py-20 border-t border-gray-100">
      <div className="flex items-end justify-between mb-12">
        <div>
          {section.shortDescription && (
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-black" />
              <span className="text-sm text-gray-500">{section.shortDescription}</span>
            </div>
          )}
          <h2 className="heading text-4xl md:text-5xl font-bold leading-tight">
            {section.title || "From the blog"}
          </h2>
        </div>
        <Link
          href="/blog"
          className="hidden md:inline-flex items-center gap-2 border border-black/20 rounded-full px-5 py-2.5 text-sm font-medium hover:bg-black hover:text-white transition-all"
        >
          View all posts
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {blogs.map((blog) => (
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
            <h3 className="heading font-semibold text-lg mb-2 group-hover:underline leading-snug">
              {blog.title}
            </h3>
            <p className="text-sm text-gray-500 line-clamp-2">{blog.content}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 md:hidden">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 border border-black/20 rounded-full px-5 py-2.5 text-sm font-medium hover:bg-black hover:text-white transition-all"
        >
          View all posts
        </Link>
      </div>
    </section>
  );
}
