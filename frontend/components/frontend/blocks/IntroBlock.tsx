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

export default function IntroBlock({ block }: { block: Block }) {
  if (!block.heading && !block.text) return null;
  return (
    <section className="bg-[#0d0d0d] text-white px-10 py-20 grid grid-cols-2 gap-20 items-start">
      <div>
        {block.heading && <p className="text-[clamp(24px,3vw,40px)] font-bold leading-[1.2] mb-6">{block.heading}</p>}
        {block.images?.length > 0 && (
          <div className="flex mb-6">
            {block.images.slice(0, 5).map((url, i) => (
              <div key={i} className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#0d0d0d] -ml-2.5 first:ml-0 relative">
                <Image src={IMG(url)} alt="" fill className="object-cover" />
              </div>
            ))}
          </div>
        )}
        {block.subheading && <p className="text-sm text-white/50">{block.subheading}</p>}
      </div>
      <div>
        {block.text && <p className="text-base leading-[1.8] text-white/75 mb-10 whitespace-pre-line">{block.text}</p>}
        {(block.meta?.client || block.meta?.industry || block.meta?.duration) && (
          <div className="grid grid-cols-3 gap-6 border-t border-white/10 pt-8">
            {["client","industry","duration"].map(key => block.meta[key] ? (
              <div key={key}>
                <p className="text-[10px] uppercase tracking-[0.1em] text-white/40 mb-1.5">{key}</p>
                <p className="text-sm font-semibold">{block.meta[key]}</p>
              </div>
            ) : null)}
          </div>
        )}
      </div>
    </section>
  );
}
