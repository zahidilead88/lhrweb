"use client";
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
  url.startsWith("http") ? url : `http://localhost:8000/${url}`;

export default function TextPatternBlock({ block }: { block: Block }) {
  const word = block.meta?.patternText || block.heading || "PATTERN";
  return (
    <section className="bg-[#0d0d0d] text-white px-10 py-15 overflow-hidden">
      <div className="grid grid-cols-2 gap-10 items-center">
        <div className="overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <p 
              key={i} 
              className={`text-[clamp(40px,7vw,96px)] font-black leading-[0.9] tracking-[-0.03em] mb-1 whitespace-nowrap transition-colors duration-300 ${
                i % 2 === 0 ? "text-white" : "text-transparent"
              }`}
              style={{ WebkitTextStroke: i % 2 === 0 ? "none" : "1px rgba(255,255,255,0.3)" }}
            >
              {word}
            </p>
          ))}
        </div>
        {block.images?.[0] && (
          <div className="relative aspect-[4/5] rounded-2xl overflow-hidden">
            <Image src={IMG(block.images[0])} alt="" fill className="object-cover" />
          </div>
        )}
      </div>
    </section>
  );
}
