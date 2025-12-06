"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

interface ProjectSlide {
  image: string;
  title: string;
  buttonText?: string;
}

const HomeProjects = () => {
  const [slides, setSlides] = useState<ProjectSlide[]>([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/projects");
        const data: ProjectSlide[] = await res.json();
        setSlides(data);
      } catch (err) {
        console.error("Failed to load projects", err);
      }
    };

    fetchProjects();
  }, []);

  return (
    <div className="w-full overflow-hidden relative group">
      <div className="flex animate-slide group-hover:paused-slide">
        {[...slides, ...slides].map((slide, i) => (
          <div
            key={i}
            className="w-[700px] h-[500px] flex-shrink-0 m-2 bg-white rounded-lg overflow-hidden relative"
          >
            <Image
              src={`http://localhost:8000/${slide.image}`}
              alt={slide.title}
              width={500}
              height={400}
              className="w-full object-cover"
            />
            <div className="p-4 text-center absolute bottom-0 w-full">
              <div className="relative z-10">
                <h3 className="text-xl font-semibold mb-2">{slide.title}</h3>
                <button className="mt-2 px-6 py-2 bg-black text-white rounded hover:bg-black/80 transition">
                  {slide.buttonText || "Learn More"}
                </button>
              </div>
              <div className="w-full h-[100%] bg-white absolute top-0 bottom-0 blur-3xl z-0"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomeProjects;
