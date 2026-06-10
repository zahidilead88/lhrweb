"use client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

import { useRef } from "react";

export default function AboutCarousel({ section }: { section: any }) {
  if (!section) return null;
  const items: { title: string; content: string }[] = section.accordion || [];
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -360 : 360, behavior: "smooth" });
  };

  return (
    <section className="py-20 border-t border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 md:px-10 lg:px-20 flex items-end justify-between mb-10">
        <div>
          {section.shortDescription && (
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-black" />
              <span className="text-sm text-gray-500">{section.shortDescription}</span>
            </div>
          )}
          <h2 className="heading text-4xl md:text-5xl font-bold leading-tight">
            {section.title}
          </h2>
        </div>
        <div className="hidden md:flex gap-3">
          <button
            type="button"
            onClick={() => scroll("left")}
            className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-black hover:text-white transition-all"
            aria-label="Scroll left"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8 1L3 6L8 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-black hover:text-white transition-all"
            aria-label="Scroll right"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M4 1L9 6L4 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Horizontal scroll track */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scroll-smooth px-6 md:px-10 lg:px-20 pb-4 scrollbar-hide"
        style={{ scrollbarWidth: "none" }}
      >
        {items.map((item, i) => (
          <div
            key={i}
            className="flex-none w-[300px] md:w-[360px] aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 relative group"
          >
            {item.content ? (
              <img
                src={item.content.startsWith("http") ? item.content : `${API}/${item.content}`}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                <span className="text-gray-400 text-sm">{item.title}</span>
              </div>
            )}
            {item.title && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-sm font-medium">{item.title}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
