"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import type { SectionExtras } from "../SectionRenderer";

interface ProjectSlide {
  _id: string;
  image: string;
  title: string;
  shortDescription?: string;
  tags?: string[];
  videoUrl?: string;
  buttonText?: string;
}

const HomeProjects = ({ section, extras }: { section?: any; extras?: SectionExtras }) => {
  const slides = (extras?.projects ?? []) as ProjectSlide[];
  const sectionRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only set up scroll handler if we have slides and refs
    if (!triggerRef.current || !sectionRef.current || slides.length === 0) return;

    const handleScroll = () => {
      const trigger = triggerRef.current;
      const section = sectionRef.current;
      if (!trigger || !section) return;

      const triggerTop = trigger.offsetTop;
      const scrollY = window.scrollY;
      
      // Calculate how far we are into the section
      // We start transforming when the section hits the top of the viewport (or close to it)
      const offset = scrollY - triggerTop;
      
      // Total scrollable height = trigger height - viewport height
      // (This assumes trigger is taller than viewport)
      const maxScroll = trigger.offsetHeight - window.innerHeight;
      
      // Total horizontal width to scroll = section scroll width - viewport width
      const totalWidth = section.scrollWidth;
      const viewportWidth = window.innerWidth;
      const maxTranslate = totalWidth - viewportWidth;

      if (maxTranslate <= 0) return; // No scrolling needed if content fits

      // Map vertical scroll (offset) to horizontal scroll
      let progress = offset / maxScroll;
      
      // Clamp progress between 0 and 1
      progress = Math.max(0, Math.min(progress, 1));
      
      const translateX = -progress * maxTranslate;
      
      section.style.transform = `translateX(${translateX}px)`;
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener("scroll", handleScroll);
  }, [slides]);

  return (
    // This outer container provides the "track" for the vertical scroll
    // height of 300vh means it takes 3 screen heights to scroll through
    <div ref={triggerRef} className="relative h-[300vh]">
      
      {/* The sticky container stays fixed in viewport while parent scrolls */}
      <div className="sticky top-0 h-screen overflow-hidden flex flex-col">
        {/* Header stays at the top */}
        <div className="flex items-center justify-between w-full px-10 pt-10">
          <h2 className="text-4xl font-bold">Projects</h2>
          <button className="px-6 py-2 bg-white text-black rounded-full hover:bg-gray-200 transition font-medium">View All</button>
        </div>
        
        {/* The horizontal track that moves left as we scroll down */}
        <div className="flex items-center flex-1">
          <div ref={sectionRef} className="flex px-10 gap-10 will-change-transform ease-linear duration-75">
            {slides.map((slide, i) => (
              <div
                key={i}
                className="w-[700px] h-[600px] flex-shrink-0 bg-white rounded-lg overflow-hidden relative shadow-lg"
              >
                <Image
                  src={`http://localhost:8000/${slide.image}`}
                  alt={slide.title}
                  width={700}
                  height={500}
                  className="w-full h-full object-cover"
                />
                <div className="p-6 text-center absolute bottom-0 w-full bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white">
                  <h3 className="text-2xl font-bold mb-2">{slide.title}</h3>
                  {slide.shortDescription && (
                    <p className="text-sm mb-4 text-gray-200 line-clamp-2">{slide.shortDescription}</p>
                  )}
                  <button className="px-6 py-2 bg-white text-black rounded-full hover:bg-gray-200 transition font-medium">
                    {slide.buttonText || "Learn More"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeProjects;
