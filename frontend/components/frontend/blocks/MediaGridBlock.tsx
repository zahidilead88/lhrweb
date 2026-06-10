"use client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";


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

export default function MediaGridBlock({ block }: { block: Block }) {
  if (!block.images?.length) return null;
  return (
    <section className="bg-[#0d0d0d] px-10 py-15">
      {block.heading && <h2 className="heading text-white text-[clamp(24px,4vw,48px)] font-bold mb-8">{block.heading}</h2>}
      <div className="columns-3 gap-3">
        {block.images.map((url, i) => (
          <div key={i} className="break-inside-avoid mb-3 rounded-xl overflow-hidden">
            <img src={IMG(url)} alt="" className="w-full block" />
          </div>
        ))}
      </div>
    </section>
  );
}
