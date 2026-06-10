"use client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

import { useState } from "react";
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

export default function CarouselBlock({ block }: { block: Block }) {
  const [idx, setIdx] = useState(0);
  if (!block.images?.length) return null;
  
  const prev = () => setIdx(i => (i === 0 ? block.images.length - 1 : i - 1));
  const next = () => setIdx(i => (i === block.images.length - 1 ? 0 : i + 1));
  
  return (
    <section className="bg-[#0d0d0d] px-10 py-15">
      {block.heading && <h2 className="heading text-white text-[clamp(24px,4vw,48px)] font-bold mb-8">{block.heading}</h2>}
      <div className="relative">
        <div className="relative aspect-[16/9] rounded-2xl overflow-hidden">
          <Image src={IMG(block.images[idx])} alt="" fill className="object-cover" />
        </div>
        {block.images.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 text-white border-none rounded-full w-11 h-11 text-xl cursor-pointer flex items-center justify-center">‹</button>
            <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 text-white border-none rounded-full w-11 h-11 text-xl cursor-pointer flex items-center justify-center">›</button>
            <div className="flex justify-center gap-2 mt-4">
              {block.images.map((_, i) => (
                <button 
                  key={i} 
                  onClick={() => setIdx(i)} 
                  className={`w-2 h-2 rounded-full border-none cursor-pointer p-0 transition-colors ${i === idx ? "bg-white" : "bg-white/30"}`} 
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
