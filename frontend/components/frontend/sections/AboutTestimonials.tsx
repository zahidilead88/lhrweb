"use client";
import { useState } from "react";

export default function AboutTestimonials({ section }: { section: any }) {
  const [active, setActive] = useState(0);
  if (!section) return null;
  const reviews: { title: string; content: string }[] = section.accordion || [];
  if (reviews.length === 0) return null;

  // content format: "quote|author|role"
  const parsed = reviews.map((r) => {
    const [quote, author, role] = r.content.split("|");
    return { name: r.title, quote: quote?.trim(), author: author?.trim(), role: role?.trim() };
  });

  const current = parsed[active];

  return (
    <section className="px-6 md:px-10 lg:px-20 py-20 border-t border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-black" />
        <span className="text-sm text-gray-500">
          {section.shortDescription || "Testimonials"}
        </span>
      </div>
      <h2 className="heading text-4xl md:text-5xl font-bold mb-16 max-w-md leading-tight">
        {section.title || "People love us"}
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Quote */}
        <blockquote className="heading text-2xl md:text-3xl font-medium leading-snug">
          "{current.quote}"
        </blockquote>

        <div>
          <p className="font-semibold">{current.author}</p>
          {current.role && <p className="text-sm text-gray-500 mb-8">{current.role}</p>}

          {/* Navigation dots */}
          <div className="flex gap-3 mt-8">
            {parsed.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === active ? "bg-black scale-125" : "bg-gray-300"
                }`}
                aria-label={`Review ${i + 1}`}
              />
            ))}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => setActive((a) => (a - 1 + parsed.length) % parsed.length)}
              className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-black hover:text-white transition-all"
              aria-label="Previous"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M8 1L3 6L8 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setActive((a) => (a + 1) % parsed.length)}
              className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-black hover:text-white transition-all"
              aria-label="Next"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M4 1L9 6L4 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* All names list */}
      <div className="mt-16 flex flex-wrap gap-4 border-t border-gray-100 pt-8">
        {parsed.map((r, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            className={`text-sm transition-all ${
              i === active ? "text-black font-semibold" : "text-gray-400 hover:text-gray-700"
            }`}
          >
            {r.name || r.author}
          </button>
        ))}
      </div>
    </section>
  );
}
