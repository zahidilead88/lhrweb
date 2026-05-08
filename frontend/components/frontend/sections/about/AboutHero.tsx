"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const ROTATIONS = [-18, -8, 2, 10, 20];

export default function AboutHero({ section }: { section: any }) {
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    fetch("http://localhost:8000/api/projects")
      .then((r) => r.json())
      .then((data) => setProjects(Array.isArray(data) ? data.slice(0, 5) : []))
      .catch(() => {});
  }, []);

  if (!section) return null;

  return (
    <section className="min-h-screen flex flex-col items-center justify-center pt-24 pb-16 px-6 overflow-hidden bg-white">
      <h1 className="text-5xl md:text-7xl font-bold text-center max-w-2xl leading-tight mb-16">
        {section.title || "Good design makes life better."}
      </h1>

      {/* Fanned photos */}
      {projects.length > 0 && (
        <div className="relative flex items-center justify-center w-full max-w-4xl h-[360px] mb-16">
          {projects.map((p, i) => (
            <div
              key={p._id}
              className="absolute w-[180px] h-[240px] rounded-2xl overflow-hidden shadow-xl border border-white"
              style={{
                transform: `rotate(${ROTATIONS[i] ?? 0}deg) translateX(${(i - 2) * 110}px)`,
                zIndex: i,
              }}
            >
              <Image
                src={`http://localhost:8000/${p.image}`}
                alt={p.title}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {section.button?.label && (
        <Link
          href={section.button.url || "/contact"}
          className="inline-flex items-center gap-2 border border-black/20 rounded-full px-6 py-3 text-sm font-medium hover:bg-black hover:text-white transition-all"
        >
          {section.button.label}
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M14 4.24128V0.471254C14 0.34627 13.9503 0.226405 13.862 0.138028C13.7736 0.0496505 13.6537 0 13.5287 0H9.75872C9.42507 0 9.29572 0.359 9.42507 0.564L10.9774 2.356L0 13.333L0.667 14L11.644 3.023L13.195 4.575C13.423 4.803 14 4.648 14 4.241Z" fill="currentColor" />
          </svg>
        </Link>
      )}
    </section>
  );
}
