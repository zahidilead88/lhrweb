"use client";

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

export default function PullQuoteBlock({ block }: { block: Block }) {
  if (!block.heading && !block.text) return null;
  return (
    <section className="bg-[#0d0d0d] text-white px-10 py-20 grid grid-cols-2 gap-20 items-center">
      <div>
        {block.subheading && <p className="text-[11px] uppercase tracking-[0.15em] text-white/40 mb-4">{block.subheading}</p>}
        {block.heading && <h2 className="text-[clamp(32px,5vw,64px)] font-extrabold leading-[1.05] tracking-[-0.02em]">{block.heading}</h2>}
      </div>
      <div>
        {block.text && <p className="text-[17px] leading-[1.8] text-white/70 whitespace-pre-line">{block.text}</p>}
      </div>
    </section>
  );
}
