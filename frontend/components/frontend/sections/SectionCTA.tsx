"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function SectionCTA({ section }: { section: any }) {
  if (!section) return null;

  const handleButtonClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const url = section.button?.url || "/contact";
    if (url === "/contact" || url === "/project-inquiry" || url === "#") {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent("open-lead-popup"));
    }
  };

  return (
    <section className="border-t border-black/10 px-6 md:px-10 lg:px-16 py-24">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
        <div>
          {section.shortDescription && (
            <div className="flex items-center gap-2 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-black block" />
              <span className="text-sm text-gray-500">{section.shortDescription}</span>
            </div>
          )}
          <h2 className="heading font-almiregodisplay text-5xl md:text-7xl lg:text-9xl leading-none tracking-tight">
            {section.title}
          </h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 md:pb-2">
          {section.button?.label && (
            <Link
              href={section.button.url || "/contact"}
              onClick={handleButtonClick}
              className="group inline-flex items-center gap-2 bg-black text-white px-8 py-4 rounded-full font-semibold text-sm hover:bg-gray-900 transition-colors duration-200 cursor-pointer"
            >
              {section.button.label}
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          )}
          <a
            href="mailto:zahid@lhrweb.com"
            className="group inline-flex items-center gap-2 border border-black/20 text-black px-8 py-4 rounded-full font-medium text-sm hover:border-black transition-colors duration-200"
          >
            Send an email
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>
      </div>
    </section>
  );
}
