import React from "react";

export default function ServicesHero({ section }: { section: any }) {
  if (!section) return null;
  return (
    <section className="px-6 md:px-10 lg:px-16 pt-36 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-black block" />
            <span className="text-sm text-gray-500">{section?.shortDescription}</span>
          </div>
          <h1 className="heading text-[7vw] md:text-[5vw] font-bold leading-tight tracking-tight max-w-lg">
            {section.title}
          </h1>
        </div>
        <div className="lg:flex lg:items-end lg:pb-2">
          <p className="text-xl md:text-2xl text-black">
            {section.description}
          </p>
        </div>
      </div>
    </section>
  );
}
