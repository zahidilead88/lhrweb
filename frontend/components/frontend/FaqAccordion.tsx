"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface Faq {
  q: string;
  a: string;
}

export default function FaqAccordion({ faqs }: { faqs: Faq[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-0">
      {faqs.map((faq, i) => (
        <div key={i} className="border-b border-white/10">
          <button
            className="w-full flex items-center justify-between py-6 text-left gap-8 group"
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span className="text-base font-medium group-hover:text-gray-300 transition-colors">
              {faq.q}
            </span>
            <ChevronDown
              className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-300 ${
                open === i ? "rotate-180" : ""
              }`}
            />
          </button>
          <div
            className={`overflow-hidden transition-all duration-300 ${
              open === i ? "max-h-48 pb-6" : "max-h-0"
            }`}
          >
            <p className="text-gray-400 text-sm leading-relaxed">{faq.a}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
