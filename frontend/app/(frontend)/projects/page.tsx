"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

interface ProjectSlide {
  image: string;
  title: string;
  buttonText?: string;
}

const Projects = () => {
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
    <div className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full bg-black block"></span>
        <h1 className="text-sm">Our Work</h1>
      </div>
      <h2 className="text-4xl">
        Take a look <br /> at our projects
      </h2>
      <div className="flex flex-wrap">
        {[...slides, ...slides].map((slide, i) => (
          <div
            key={i}
            className="w-[500px] first:w-[70%] h-auto flex-shrink-0 m-2 bg-white rounded-lg overflow-hidden relative"
          >
            <Image
              src={`http://localhost:8000/${slide.image}`}
              alt={slide.title}
              width={500}
              height={400}
              className="w-full max-h-[400px] object-cover"
            />
            <div className="p-4 text-center">
              <div className="relative z-10">
                <h3 className="text-xl font-semibold mb-2">{slide.title}</h3>
                <button className="mt-2 px-6 py-2 bg-black text-white rounded hover:bg-black/80 transition">
                  {slide.buttonText || "Learn More"}
                </button>
              </div>
              <div className="w-full h-[100%] bg-white absolute top-0 bottom-0 blur-2xl z-0"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Projects;
