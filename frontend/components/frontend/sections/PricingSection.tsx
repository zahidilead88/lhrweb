"use client";
import { useState } from "react";
import Link from "next/link";

const BADGE_STYLES: Record<string, string> = {
  "most popular": "bg-purple-100 text-purple-700",
  "best value":   "bg-lime-100 text-lime-700",
  "popular":      "bg-purple-100 text-purple-700",
  "recommended":  "bg-blue-100 text-blue-700",
};

function badgeClass(badge: string) {
  return BADGE_STYLES[badge.toLowerCase()] ?? "bg-gray-100 text-gray-700";
}

function ArrowIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" className="shrink-0">
      <path d="M14 4.24128V0.471254C14 0.34627 13.9503 0.226405 13.862 0.138028C13.7736 0.0496505 13.6537 0 13.5287 0H9.75872C9.42507 0 9.29572 0.359 9.42507 0.564L10.9774 2.356L0 13.333L0.667 14L11.644 3.023L13.195 4.575C13.423 4.803 14 4.648 14 4.241Z" fill="currentColor" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function PricingSection({ section }: { section: any }) {
  const [tab, setTab] = useState<"subscription" | "project">("subscription");

  // Each accordion item content: type|badge|price|period|description|features(;-separated)|buttonText|note
  const plans = (section.accordion || []).map((item: any) => {
    const parts = item.content.split("|");
    return {
      name:        item.title,
      type:        (parts[0] || "subscription").trim(),
      badge:       (parts[1] || "").trim(),
      price:       (parts[2] || "").trim(),
      period:      (parts[3] || "").trim(),
      description: (parts[4] || "").trim(),
      features:    (parts[5] || "").split(";").map((f: string) => f.trim()).filter(Boolean),
      buttonText:  (parts[6] || "Get started").trim(),
      note:        (parts[7] || "").trim(),
    };
  });

  const visible = plans.filter((p: any) => p.type === tab);
  const heading = tab === "subscription" ? section.title : section.shortDescription;

  return (
    <section className="px-6 md:px-10 lg:px-20 py-20 border-t border-gray-100">

      {/* Toggle */}
      <div className="flex items-center gap-3 mb-10">
        <button
          type="button"
          onClick={() => setTab("subscription")}
          className={`text-sm font-medium transition-colors ${tab === "subscription" ? "text-black" : "text-gray-400 hover:text-gray-600"}`}
        >
          Subscriptions
        </button>
        <button
          type="button"
          role="switch"
          aria-checked={tab === "project"}
          onClick={() => setTab(tab === "subscription" ? "project" : "subscription")}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
            tab === "project" ? "bg-black" : "bg-gray-300"
          }`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            tab === "project" ? "translate-x-6" : "translate-x-1"
          }`} />
        </button>
        <button
          type="button"
          onClick={() => setTab("project")}
          className={`text-sm font-medium transition-colors ${tab === "project" ? "text-black" : "text-gray-400 hover:text-gray-600"}`}
        >
          Projects
        </button>
      </div>

      {/* Heading */}
      {heading && (
        <h2 className="heading text-3xl md:text-4xl font-bold leading-tight max-w-xl mb-12">
          {heading}
        </h2>
      )}

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {visible.map((plan: any, i: number) => (
          <div key={i} className="border border-gray-200 rounded-2xl p-6 flex flex-col">
            {plan.badge && (
              <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4 w-fit ${badgeClass(plan.badge)}`}>
                {plan.badge}
              </span>
            )}

            <h3 className="heading text-lg font-bold mb-1">{plan.name}</h3>
            {plan.description && (
              <p className="text-sm text-gray-500 mb-4 leading-relaxed">{plan.description}</p>
            )}

            {plan.price && (
              <div className="mb-5">
                <span className="text-sm align-top mt-1 inline-block">$</span>
                <span className="heading text-5xl font-bold leading-none">{plan.price}</span>
                {plan.period && (
                  <span className="text-sm text-gray-500 ml-1">{plan.period}</span>
                )}
              </div>
            )}

            <Link
              href={section.button?.url || "/contact"}
              className="w-full bg-black text-white text-sm font-medium py-3 px-4 rounded-xl flex items-center justify-between hover:bg-gray-800 transition-colors mb-2"
            >
              <span>{plan.buttonText}</span>
              <ArrowIcon />
            </Link>

            {plan.note && (
              <p className="text-xs text-center text-gray-400 underline underline-offset-2 mb-2 cursor-pointer hover:text-gray-600">
                {plan.note}
              </p>
            )}

            {plan.features.length > 0 && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-700 mb-3">What's included</p>
                <ul className="space-y-2">
                  {plan.features.map((f: string, j: number) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckIcon />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}

        {/* "Build your own" custom card */}
        {section.button?.label && (
          <div className="border border-gray-200 rounded-2xl p-6 flex flex-col justify-between min-h-[300px]">
            <h3 className="heading text-2xl md:text-3xl font-bold leading-snug">
              {section.description || "Build your own plan. We'll tailor the perfect team."}
            </h3>
            <div className="mt-6">
              <Link
                href={section.button.url || "/contact"}
                className="w-full bg-black text-white text-sm font-medium py-3 px-4 rounded-xl flex items-center justify-between hover:bg-gray-800 transition-colors"
              >
                <span>{section.button.label}</span>
                <ArrowIcon />
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
