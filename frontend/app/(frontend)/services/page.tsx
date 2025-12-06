"use client";
import BuildFuture from "@/components/frontend/home/BuildFuture";
import React, { useEffect, useState } from "react";

const Services = () => {
  const [sections, setSections] = useState<any[]>([]);

  useEffect(() => {
    fetch("http://localhost:8000/api/sections?page")
      .then((res) => res.json())
      .then(setSections);
  }, []);
  console.log(sections);

  // Find sections by title or another identifier
  //const bannerSection = sections.find((s) => s.key === "new-section");
  const projectsSection = sections.find((s) => s.key === "new-section");
  // ...repeat for other sections as needed
  return (
    <div>
      <h2>Services</h2>
      <BuildFuture section={projectsSection} />
    </div>
  );
};

export default Services;
