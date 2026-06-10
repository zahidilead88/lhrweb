"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { notFound } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || `${API}`;

interface Package {
  name: string;
  price: string;
  period: string;
  tagline: string;
  features: string[];
  popular: boolean;
}

interface ProcessStep {
  step: string;
  title: string;
  body: string;
}

interface OtherService {
  slug: string;
  label: string;
  description: string;
}

interface Service {
  slug: string;
  label: string;
  headline: string;
  description: string;
  longDescription: string;
  capabilities: string[];
  process: ProcessStep[];
  packages: Package[];
  others: OtherService[];
}

export default function ServicePage() {
  const { slug } = useParams<{ slug: string }>();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/services/${slug}`)
      .then((r) => {
        if (!r.ok) { setMissing(true); return null; }
        return r.json();
      })
      .then((data) => {
        if (data) setService(data);
        setLoading(false);
      })
      .catch(() => { setMissing(true); setLoading(false); });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-black/10 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  if (missing || !service) {
    notFound();
    return null;
  }

  return (
    <div className="bg-white text-black">

      {/* ── Hero ── */}
      <section className="px-6 pt-28 pb-20 max-w-5xl mx-auto">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400 mb-5">
          Service
        </p>
        <h1 className="heading text-[40px] sm:text-[56px] md:text-[68px] font-black leading-[1.05] tracking-tight mb-6 max-w-3xl">
          {service.headline || service.label}
        </h1>
        {service.description && (
          <p className="text-gray-500 text-lg max-w-2xl leading-relaxed">
            {service.description}
          </p>
        )}
      </section>

      {/* ── Long description ── */}
      {service.longDescription && (
        <section className="px-6 pb-20 max-w-5xl mx-auto">
          <div
            className="prose prose-gray max-w-none text-gray-600 leading-relaxed text-[15px]"
            style={{ whiteSpace: "pre-wrap" }}
          >
            {service.longDescription}
          </div>
        </section>
      )}

      {/* ── Capabilities ── */}
      {service.capabilities?.length > 0 && (
        <section className="px-6 pb-24 max-w-5xl mx-auto">
          <h2 className="heading text-[13px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-8">
            What&apos;s included
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {service.capabilities.map((cap) => (
              <div
                key={cap}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                style={{ border: "1.5px solid #e8e8e8" }}
              >
                <span
                  className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
                  style={{ background: "#000" }}
                >
                  <svg width="8" height="6" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="text-[13px] font-medium text-gray-700">{cap}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Process ── */}
      {service.process?.length > 0 && (
        <section className="px-6 pb-24 max-w-5xl mx-auto">
          <h2 className="heading text-[13px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-10">
            How it works
          </h2>
          <div className="space-y-0">
            {service.process.map((item, i) => (
              <div
                key={i}
                className="flex gap-6 pb-10"
              >
                {/* Step number + line */}
                <div className="flex flex-col items-center">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-[12px] font-black"
                    style={{ background: "#000", color: "#fff" }}
                  >
                    {item.step || String(i + 1).padStart(2, "0")}
                  </div>
                  {i < service.process.length - 1 && (
                    <div className="w-px flex-1 mt-2" style={{ background: "#e8e8e8" }} />
                  )}
                </div>
                {/* Content */}
                <div className="pb-2 pt-1.5">
                  <h3 className="heading text-[16px] font-bold mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-[14px] leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Packages ── */}
      {service.packages?.length > 0 && (
        <section className="px-6 pb-24 max-w-5xl mx-auto">
          <h2 className="heading text-[13px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-10">
            Pricing
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {service.packages.map((pkg, i) => (
              <div
                key={i}
                className="rounded-[28px] bg-white flex flex-col overflow-hidden"
                style={{ border: "1.5px solid #e8e8e8", boxShadow: "0 2px 24px 0 rgba(0,0,0,0.06)" }}
              >
                {/* Card top */}
                <div className="px-8 pt-8 pb-6 flex-1 flex flex-col">
                  {pkg.popular && (
                    <span className="text-[10px] font-black uppercase tracking-[0.16em] px-3 py-1 rounded-full self-start mb-4" style={{ background: "#000", color: "#fff" }}>
                      Most popular
                    </span>
                  )}
                  {/* Plan name */}
                  <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-gray-400 mb-6">
                    {pkg.name}
                  </p>
                  {/* Big price */}
                  <div className="mb-2">
                    <span
                      className="heading font-black leading-none tracking-tighter"
                      style={{ fontSize: "clamp(64px, 12vw, 88px)" }}
                    >
                      {pkg.price}
                    </span>
                  </div>
                  {/* Period / tagline */}
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-400 mb-8">
                    {pkg.period}{pkg.period && pkg.tagline ? " · " : ""}{pkg.tagline}
                  </p>
                  {/* CTA */}
                  <button
                    className="w-full py-4 rounded-full text-[13px] font-black uppercase tracking-[0.14em] flex items-center justify-center gap-2.5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    style={{ background: "#c8f135", color: "#000" }}
                  >
                    Get Started
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                      <path d="M14 4.24V.47C14 .35 13.95.23 13.86.14 13.77.05 13.65 0 13.53 0H9.76c-.09 0-.18.03-.25.08-.08.05-.14.13-.17.21-.04.09-.04.18-.02.27.02.09.07.17.13.23L11.98 2.36 0 13.33l.67.67 10.97-10.97 1.55 1.55c.07.07.15.11.24.13.09.02.18.01.27-.03.08-.04.15-.1.2-.18.05-.07.08-.16.08-.25Z" fill="currentColor" />
                    </svg>
                  </button>
                  {/* Features */}
                  <ul className="mt-8 space-y-3">
                    {pkg.features.map((f) => (
                      <li key={f} className="flex items-center gap-3 text-[13px] text-gray-600">
                        <span className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: "#000" }}>
                          <svg width="8" height="6" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Dashed separator */}
                <div className="mx-6 my-1" style={{ borderTop: "1.5px dashed #e0e0e0" }} />
                {/* Tax footnote */}
                <div className="px-8 py-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400 leading-relaxed text-center">
                    Taxes (if applicable) will be calculated at checkout.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Other services ── */}
      {service.others?.length > 0 && (
        <section className="px-6 pb-24 max-w-5xl mx-auto">
          <div className="h-px mb-14" style={{ background: "#e8e8e8" }} />
          <h2 className="heading text-[13px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-8">
            Other services
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {service.others.map((s) => (
              <Link
                key={s.slug}
                href={`/services/${s.slug}`}
                className="group p-5 rounded-2xl transition-all"
                style={{ border: "1.5px solid #e8e8e8" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "#000")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "#e8e8e8")}
              >
                <h3 className="heading text-[14px] font-bold mb-1.5">{s.label}</h3>
                {s.description && (
                  <p className="text-[13px] text-gray-500 leading-relaxed line-clamp-2">{s.description}</p>
                )}
                <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-gray-400 group-hover:text-black transition-colors">
                  Learn more
                  <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                    <path d="M14 4.24V.47C14 .35 13.95.23 13.86.14 13.77.05 13.65 0 13.53 0H9.76c-.09 0-.18.03-.25.08-.08.05-.14.13-.17.21-.04.09-.04.18-.02.27.02.09.07.17.13.23L11.98 2.36 0 13.33l.67.67 10.97-10.97 1.55 1.55c.07.07.15.11.24.13.09.02.18.01.27-.03.08-.04.15-.1.2-.18.05-.07.08-.16.08-.25Z" fill="currentColor" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
