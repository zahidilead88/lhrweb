"use client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import type { SectionExtras } from "../SectionRenderer";

interface Blog {
  _id: string;
  title: string;
  content: string;
  thumbnail?: string;
  createdAt?: string;
}

export default function FeaturedBlogs({ section, extras }: { section: any; extras?: SectionExtras }) {
  const selectedIds: string[] = (section?.accordion || []).map((a: any) => a.content).filter(Boolean);
  const allBlogs = (extras?.blogs ?? []) as Blog[];
  
  const blogs = selectedIds.length
    ? selectedIds.map((id) => allBlogs.find((b) => b._id === id)).filter(Boolean) as Blog[]
    : allBlogs.slice(0, 3);

  if (!section || blogs.length === 0) return null;

  return (
    <section className="px-6 md:px-10 lg:px-20 py-24 bg-gray-50/30">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            {section.shortDescription && (
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">
                {section.shortDescription}
              </p>
            )}
            <h2 className="heading text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
              {section.title || "Latest Thinking"}
            </h2>
          </div>
          <Link 
            href="/blog" 
            className="group flex items-center gap-3 text-[13px] font-bold uppercase tracking-widest text-gray-900"
          >
            Read all posts
            <span className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center group-hover:bg-black group-hover:border-black group-hover:text-white transition-all duration-300">
              →
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {blogs.map((blog) => (
            <Link 
              key={blog._id} 
              href={`/blog/${blog._id}`}
              className="group block space-y-6"
            >
              <div className="relative aspect-video overflow-hidden rounded-3xl bg-white shadow-sm border border-gray-100">
                {blog.thumbnail ? (
                  <Image
                    src={`${API}/${blog.thumbnail}`}
                    alt={blog.title}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                ) : (
                   <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300">
                     No Thumbnail
                   </div>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                   <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                     Journal
                   </span>
                   <span className="w-1 h-1 rounded-full bg-gray-200" />
                   <span className="text-[10px] font-medium text-gray-400">
                     {blog.createdAt ? new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
                   </span>
                </div>
                <h3 className="heading text-xl md:text-2xl font-bold text-gray-900 group-hover:text-gray-600 transition-colors leading-snug">
                  {blog.title}
                </h3>
                <p className="text-gray-500 text-[14px] leading-relaxed line-clamp-2">
                  {blog.content}
                </p>
                <div className="pt-2">
                   <span className="text-[11px] font-bold uppercase tracking-widest text-black border-b border-black/10 group-hover:border-black transition-colors pb-1">
                     Read Article
                   </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
