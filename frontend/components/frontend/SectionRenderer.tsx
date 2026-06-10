import React from "react";
import type { ComponentType } from "react";
import BlockRenderer from "./BlockRenderer";

// All sections consolidated into one folder
import HomeBanner from "./sections/HomeBanner";
import VoilaBanner from "./sections/VoilaBanner";
import HomeProjects from "./sections/HomeProjects";
import BuildFuture from "./sections/BuildFuture";
import OurExpertise from "./sections/OurExpertise";
import HomeFaq from "./sections/HomeFaq";
import HomeBlog from "./sections/HomeBlog";
import ConversionSection from "./sections/ConversionSection";

import ServicesHero from "./sections/ServicesHero";
import ServiceCategory from "./sections/ServiceCategory";
import SectionCTA from "./sections/SectionCTA";
import PricingSection from "./sections/PricingSection";

import AboutHero from "./sections/AboutHero";
import AboutIntro from "./sections/AboutIntro";
import AboutTeam from "./sections/AboutTeam";
import AboutCounters from "./sections/AboutCounters";
import AboutClients from "./sections/AboutClients";
import AboutTestimonials from "./sections/AboutTestimonials";
import AboutCulture from "./sections/AboutCulture";
import AboutBlog from "./sections/AboutBlog";
import AboutCarousel from "./sections/AboutCarousel";

import ContactForm from "./sections/ContactForm";
import ProjectsListing from "./sections/ProjectsListing";
import BlogListing from "./sections/BlogListing";
import FeaturedProjects from "./sections/FeaturedProjects";
import FeaturedBlogs from "./sections/FeaturedBlogs";
import BrandFeatures from "./sections/BrandFeatures";

export interface SectionExtras { blogs?: any[]; projects?: any[] }

// Registry: section key → component
// VoilaBanner doesn't use section props — wrap it so it fits the registry signature
const VoilaBannerWrapper: ComponentType<{ section: any; extras?: SectionExtras }> = () => <VoilaBanner />;

const REGISTRY: Record<string, ComponentType<{ section: any; extras?: SectionExtras }>> = {
  // ── Home ──────────────────────────────────────────────────
  "voila-banner":       VoilaBannerWrapper,
  "home-banner":        HomeBanner,
  "home-projects":      HomeProjects,
  "build-future":       BuildFuture,
  "our-expertise":      OurExpertise,
  "faq":                HomeFaq,
  "home-blog":          HomeBlog,
  "conversion-section": ConversionSection,

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
  "cta":              SectionCTA,
  "pricing":          PricingSection,
  "contact-form":     ContactForm,
  "projects-listing": ProjectsListing,
  "blog-listing":     BlogListing,
  "featured-projects": FeaturedProjects,
  "featured-blogs":    FeaturedBlogs,
  "brand-features":    BrandFeatures,
};

export default function SectionRenderer({ section, extras }: { section: any; extras?: { blogs?: any[]; projects?: any[] } }) {
  if (section.enabled === false) return null;

  const Component = REGISTRY[section?.key];
  const hasBlocks = Array.isArray(section.blocks) && section.blocks.length > 0;

  // If this section has a registered component, render it (+ any blocks underneath)
  if (Component) {
    return (
      <>
        <Component section={section} extras={extras} />
        {hasBlocks && <BlockRenderer blocks={section.blocks} />}
      </>
    );
  }

  // If no registered component but has content blocks, render those
  if (hasBlocks) {
    return <BlockRenderer blocks={section.blocks} />;
  }

  // Section exists in DB but no component registered for its key — nothing to show
  return null;
}
