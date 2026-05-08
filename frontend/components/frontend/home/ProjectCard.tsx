"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface ProjectCardProps {
  project: {
    _id: string;
    title: string;
    image: string;
    shortDescription: string;
    tags?: string[];
    videoUrl?: string;
    buttonText?: string;
  };
  index: number;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, index }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  // Logic to determine col-span for visual variety (like in the snippet)
  // Let's say items at index 1, 2, 4, 5 (of a set of 6) span 3 columns?
  // The snippet had:
  // Item 0: no col-span (col 1)
  // Item 1: lg:col-span-3
  // Item 2: lg:col-span-3
  // Item 3: no col-span
  // Item 4: lg:col-span-3
  // Item 5: lg:col-span-3
  // This seems to alternate: 1 small, 2 large, 1 small, 2 large...
  
  // const isLarge = index % 3 !== 0; 
  // index 0 -> false (small)
  // index 1 -> true (large)
  // index 2 -> true (large)
  // index 3 -> false (small)
  // ...

  const handleMouseEnter = () => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  return (
    <li 
      className={`test-reveal relative grid gap-[5px] md:gap-[10px] lg:col-span-3`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div 
        ref={containerRef}
        className="view-project-tooltip group relative cursor-pointer duration-500"
        onMouseMove={handleMouseMove}
      >
        <div className="overflow-hidden rounded-[15px] lg:rounded-[30px] relative">
          {project.videoUrl ? (
            <>
              <video
                ref={videoRef}
                className="invisible xl:visible bg-[grey] w-full h-auto object-cover aspect-[680/510] rounded-[15px] lg:rounded-[30px] duration-500 group-hover:opacity-60 transition-all group-hover:scale-105"
                playsInline
                preload="auto"
                loop
                muted
              >
                <source src={`http://localhost:8000/${project.videoUrl}`} type="video/mp4" />
              </video>
              <Image
                src={`http://localhost:8000/${project.image}`}
                alt={project.title}
                width={750}
                height={562}
                className="absolute top-0 left-0 w-full h-full object-cover rounded-[15px] xl:hidden transition-all group-hover:scale-105"
              />
            </>
          ) : (
            <Image
              src={`http://localhost:8000/${project.image}`}
              alt={project.title}
              width={750}
              height={562}
              className="w-full h-auto object-cover aspect-[680/510] rounded-[15px] lg:rounded-[30px] duration-500 group-hover:opacity-60 transition-all group-hover:scale-105"
              loading="lazy"
            />
          )}
          
          {project.tags && project.tags.length > 0 && (
            <span className="absolute top-[10px] md:top-[24px] left-[10px] md:left-[20px] bg-white text-[7px] md:text-[18px] font-bold px-[10px] md:px-[20px] py-[4px] md:py-[10px] rounded-[30px] capitalize">
              {project.tags[0]}
            </span>
          )}
        </div>

        <div 
          className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: 'translate(-50%, -50%)',
            transition: 'opacity 0.3s ease'
          }}
        >
          <div className="bg-black text-white px-2 md:px-6 py-1 md:py-2 rounded-md text-[10px] md:text-[10px] flex items-center gap-2 whitespace-nowrap shadow-xl">
            View Project
            {/* <ArrowUpRight className="w-4 h-4 md:w-6 md:h-6" /> */}
          </div>
        </div>
      </div>

      <Link href={`/projects/${project._id}`} className="grid font-bold cursor-pointer">
        <span className="leading-[-0.02em] text-[14px] md:text-[20px]">{project.title}</span>
        <span className="text-[12px] md:text-[14px] grey leading-[1.3] font-normal text-gray-500">
          {project.shortDescription}
        </span>
      </Link>
    </li>
  );
};

export default ProjectCard;
