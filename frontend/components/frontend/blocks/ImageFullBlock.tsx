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

export default function ImageFullBlock({ block }: { block: Block }) {
  if (!block.images?.[0]) return null;
  return (
    <section className="bg-[#0d0d0d] p-10">
      <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden">
        <Image src={IMG(block.images[0])} alt={block.heading || ""} fill className="object-cover" />
      </div>
    </section>
  );
}
