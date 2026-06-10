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

export default function Image2ColBlock({ block }: { block: Block }) {
  if (!block.images?.length) return null;
  return (
    <section className="bg-[#0d0d0d] p-10">
      <div className="grid grid-cols-2 gap-4">
        {block.images.slice(0, 2).map((url, i) => (
          <div key={i} className="relative aspect-[4/3] rounded-2xl overflow-hidden">
            <Image src={IMG(url)} alt="" fill className="object-cover" />
          </div>
        ))}
      </div>
    </section>
  );
}
