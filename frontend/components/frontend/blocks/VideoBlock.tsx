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

const IMG = (url: string) =>
  url.startsWith("http") ? url : `http://localhost:8000/${url}`;

export default function VideoBlock({ block }: { block: Block }) {
  if (!block.videoUrl) return null;
  return (
    <section className="bg-[#0d0d0d] p-10">
      {block.heading && <h2 className="text-white text-[clamp(24px,4vw,48px)] font-bold mb-8">{block.heading}</h2>}
      <div className="rounded-2xl overflow-hidden">
        <video src={IMG(block.videoUrl)} controls className="w-full block" />
      </div>
    </section>
  );
}
