"use client";
import React from "react";

// Block components
import HeroBlock from "./blocks/HeroBlock";
import IntroBlock from "./blocks/IntroBlock";
import ImageFullBlock from "./blocks/ImageFullBlock";
import Image2ColBlock from "./blocks/Image2ColBlock";
import VideoBlock from "./blocks/VideoBlock";
import PullQuoteBlock from "./blocks/PullQuoteBlock";
import CarouselBlock from "./blocks/CarouselBlock";
import MediaGridBlock from "./blocks/MediaGridBlock";
import TextPatternBlock from "./blocks/TextPatternBlock";

export interface Block {
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

export interface ContentSection {
  _id?: string;
  name: string;
  enabled?: boolean;
  order: number;
  blocks: Block[];
}

export default function BlockRenderer({ blocks }: { blocks?: Block[] }) {
  if (!blocks?.length) return null;
  
  // Filter enabled blocks and sort by order
  const sorted = [...blocks]
    .filter(b => b.enabled !== false)
    .sort((a, b) => a.order - b.order);

  return (
    <>
      {sorted.map((block, i) => {
        switch (block.type) {
          case "hero":         return <HeroBlock        key={i} block={block} />;
          case "intro":        return <IntroBlock       key={i} block={block} />;
          case "image-full":   return <ImageFullBlock   key={i} block={block} />;
          case "image-2col":   return <Image2ColBlock   key={i} block={block} />;
          case "video":        return <VideoBlock       key={i} block={block} />;
          case "pull-quote":   return <PullQuoteBlock   key={i} block={block} />;
          case "carousel":     return <CarouselBlock    key={i} block={block} />;
          case "media-grid":   return <MediaGridBlock   key={i} block={block} />;
          case "text-pattern": return <TextPatternBlock key={i} block={block} />;
          default:             return null;
        }
      })}
    </>
  );
}
