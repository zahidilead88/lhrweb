"use client";
import React, { useEffect, useState } from "react";
import HomeBanner from "@/components/frontend/home/HomeBanner";
import HomeProjects from "@/components/frontend/home/HomeProjects";
import BuildFuture from "@/components/frontend/home/BuildFuture";
import OurExpertise from "@/components/frontend/home/OurExpertise";
import HomeFaq from "@/components/frontend/home/HomeFaq";

export default function HomePage() {
  const [sections, setSections] = useState<any[]>([]);

  useEffect(() => {
    fetch("http://localhost:8000/api/sections?page")
      .then((res) => res.json())
      .then(setSections);
  }, []);
  console.log(sections);

  // Find sections by title or another identifier
  const bannerSection = sections.find((s) => s.key === "home-banner");
  const projectsSection = sections.find((s) => s.key === "home-projects");
  const buildFuture = sections.find((s) => s.key === "build-future");
  const ourExpertise = sections.find((s) => s.key === "our-expertise");
  const faq = sections.find((s) => s.key === "faq");
  // ...repeat for other sections as needed

  return (
    <>
      <HomeBanner section={bannerSection} />
      <HomeProjects section={projectsSection} />
      {/* Pass other section data as needed */}
      <BuildFuture section={buildFuture} />
      <OurExpertise section={ourExpertise} />
      <HomeFaq section={faq} />
    </>
  );
}
