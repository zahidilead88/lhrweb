import React from "react";
import type { ComponentType } from "react";

// Home sections
import HomeBanner from "./home/HomeBanner";
import HomeProjects from "./home/HomeProjects";
import BuildFuture from "./home/BuildFuture";
import OurExpertise from "./home/OurExpertise";
import HomeFaq from "./home/HomeFaq";
import HomeBlog from "./home/HomeBlog";

// Services sections
import ServicesHero from "./sections/ServicesHero";
import ServiceCategory from "./sections/ServiceCategory";
import SectionCTA from "./sections/SectionCTA";

// About sections
import AboutHero from "./sections/about/AboutHero";
import AboutIntro from "./sections/about/AboutIntro";
import AboutTeam from "./sections/about/AboutTeam";
import AboutCounters from "./sections/about/AboutCounters";
import AboutClients from "./sections/about/AboutClients";
import AboutTestimonials from "./sections/about/AboutTestimonials";
import AboutCulture from "./sections/about/AboutCulture";
import AboutBlog from "./sections/about/AboutBlog";
import AboutCarousel from "./sections/about/AboutCarousel";

// Registry: section key → component
// Add new sections here to make them available on any page via admin
const REGISTRY: Record<string, ComponentType<{ section: any }>> = {
  // ── Home ──────────────────────────────────────────────────
  "home-banner": HomeBanner,
  "home-projects": HomeProjects,
  "build-future": BuildFuture,
  "our-expertise": OurExpertise,
  "faq": HomeFaq,
  "home-blog": HomeBlog,

  // ── Services ──────────────────────────────────────────────
  "services-hero":   ServicesHero,
  "services-design": ServiceCategory,

  // ── About ─────────────────────────────────────────────────
  "about-hero":         AboutHero,
  "about-intro":        AboutIntro,
  "about-team":         AboutTeam,
  "about-counters":     AboutCounters,
  "about-clients":      AboutClients,
  "about-testimonials": AboutTestimonials,
  "about-culture":      AboutCulture,
  "about-blog":         AboutBlog,
  "about-carousel":     AboutCarousel,

  // ── Generic (reusable on any page) ────────────────────────
  "cta": SectionCTA,
};

export default function SectionRenderer({ section }: { section: any }) {
  const Component = REGISTRY[section?.key];
  if (!Component) return null;
  return <Component section={section} />;
}
