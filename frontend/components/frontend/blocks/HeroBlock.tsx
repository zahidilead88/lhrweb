"use client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

import Image from "next/image";

interface Block {
  _id?: string;
  type: string;
  heading: string;
  subheading: string;
  text: string;
  images: string[];
  videoUrl: string;
  meta: Record<string, string>;
  enabled?: boolean;
  order: number;
}

const IMG = (url: string) =>
  url.startsWith("http") ? url : `${API}/${url}`;

export default function HeroBlock({ block }: { block: Block }) {
  const img = block.images?.[0];
  if (!block.heading && !img) return null;
  return (
    <section className="bg-[#0d0d0d] text-white px-10 pt-20 flex flex-col justify-end min-h-[80vh]">
      <div className="flex justify-between items-start mb-auto pb-10">
        {block.subheading && (
          <span className="text-[11px] font-bold uppercase tracking-[0.1em] border border-white/30 px-3 py-1 rounded-full text-white/70">
            {block.subheading}
          </span>
        )}
        {block.meta?.year && (
          <span className="text-xs text-white/50">{block.meta.year}{block.meta.client ? ` • ${block.meta.client}` : ""}</span>
        )}
      </div>
      {block.heading && (
        <h1 className="heading text-[clamp(48px,10vw,120px)] font-black leading-[0.95] tracking-[-0.03em] mb-12 text-white">
          {block.heading}
        </h1>
      )}
      {img && (
        <div className="relative w-full aspect-[16/9] rounded-t-2xl overflow-hidden">
          <Image src={IMG(img)} alt={block.heading || ""} fill className="object-cover" priority />
        </div>
      )}
    </section>
  );
}
