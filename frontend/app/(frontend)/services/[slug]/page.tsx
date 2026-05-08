import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { services } from "@/lib/services";
import FaqAccordion from "@/components/frontend/FaqAccordion";

const faqs = [
  { q: "How long does a typical project take?", a: "Timelines vary by scope. A basic website takes 2–3 weeks; complex platforms can take 6–12 weeks. We give you a clear timeline after our initial discovery call." },
  { q: "Do you work with international clients?", a: "Absolutely. We work with clients across the UK, US, Middle East, and beyond. Our team is fully remote-capable with async collaboration across time zones." },
  { q: "Can I upgrade my package later?", a: "Yes. All packages are designed to scale. You can upgrade at any time and we'll apply the difference — ensuring a smooth, zero-friction transition." },
  { q: "Do you offer ongoing support after launch?", a: "Every package includes a post-launch support window. Beyond that, we offer retainer-based maintenance plans so your site stays fast, secure, and up to date." },
  { q: "What do you need from me to get started?", a: "Just a brief — tell us about your business, goals, and timeline. Book a free discovery call and we'll walk you through the entire process." },
];

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.id }));
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = services.find((s) => s.id === slug);
  if (!service) notFound();

  const otherServices = services.filter((s) => s.id !== service.id).slice(0, 3);

  return (
    <main className="bg-black text-white min-h-screen">
      {/* Back link */}
      <div className="px-6 md:px-10 lg:px-20 pt-32 pb-0">
        <Link
          href="/services"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors group"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="rotate-180 group-hover:-translate-x-0.5 transition-transform">
            <path d="M14 4.24128V0.471254C14 0.34627 13.9503 0.226405 13.862 0.138028C13.7736 0.0496505 13.6537 0 13.5287 0L9.75872 0C9.42507 0 9.25872 0.400901 9.42507 0.638028L10.9774 2.35627L0 13.3327L0.667295 14L11.6437 3.02262L13.1951 4.57493C13.3614 4.74128 13.6614 4.57493 13.6614 4.24128H14Z" fill="currentColor"/>
          </svg>
          All Services
        </Link>
      </div>

      {/* Hero */}
      <section className="px-6 md:px-10 lg:px-20 pt-12 pb-20 border-b border-white/10">
        <div className="flex items-center gap-2 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#b5ff4d] block" />
          <span className="text-sm text-gray-400 uppercase tracking-widest">{service.label}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-end">
          <h1 className="font-almiregodisplay text-[10vw] md:text-[7vw] leading-none tracking-tight whitespace-pre-line">
            {service.headline}
          </h1>
          <div className="lg:pb-2">
            <p className="text-gray-400 text-lg leading-relaxed mb-4">{service.description}</p>
            <p className="text-gray-500 text-base leading-relaxed mb-8">{service.longDescription}</p>
            <Link
              href={`/contact?service=${service.id}`}
              className="group inline-flex items-center gap-2 bg-[#b5ff4d] text-black px-7 py-3 rounded-full font-semibold text-sm hover:bg-white transition-colors duration-200"
            >
              Start a Project
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Capabilities + Process */}
      <section className="px-6 md:px-10 lg:px-20 py-20 border-b border-white/10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Capabilities */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-6">• What's Included</p>
            <ul className="space-y-3">
              {service.capabilities.map((cap) => (
                <li key={cap} className="flex items-center gap-3 text-base text-gray-200">
                  <Check className="w-4 h-4 text-[#b5ff4d] flex-shrink-0" />
                  {cap}
                </li>
              ))}
            </ul>
          </div>

          {/* Process */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-6">• How We Work</p>
            <div className="space-y-8">
              {service.process.map((step) => (
                <div key={step.step} className="flex gap-6">
                  <span className="text-xs text-gray-700 font-mono mt-1 flex-shrink-0">{step.step}</span>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{step.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 md:px-10 lg:px-20 py-20 border-b border-white/10">
        <div className="mb-12">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">• Pricing</p>
          <h2 className="text-3xl md:text-4xl font-bold">Simple, transparent plans.</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {service.packages.map((pkg) => (
            <div
              key={pkg.name}
              className={`relative rounded-2xl p-8 flex flex-col ${
                pkg.popular
                  ? "bg-white text-black"
                  : "bg-[#0d0d0d] text-white border border-white/10"
              }`}
            >
              {pkg.popular && (
                <span className="absolute -top-3 left-8 bg-[#b5ff4d] text-black text-xs font-bold px-4 py-1 rounded-full">
                  Most Popular
                </span>
              )}

              <div className="mb-6">
                <p className={`text-xs uppercase tracking-widest mb-2 ${pkg.popular ? "text-gray-500" : "text-gray-400"}`}>
                  {pkg.name}
                </p>
                <div className="flex items-end gap-1 mb-2">
                  <span className="text-4xl font-bold leading-none">{pkg.price}</span>
                  {pkg.period !== "one-time" && (
                    <span className={`text-sm mb-1 ${pkg.popular ? "text-gray-500" : "text-gray-400"}`}>{pkg.period}</span>
                  )}
                </div>
                <p className={`text-sm ${pkg.popular ? "text-gray-600" : "text-gray-400"}`}>{pkg.tagline}</p>
              </div>

              <ul className="space-y-3 flex-1 mb-8">
                {pkg.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${pkg.popular ? "text-black" : "text-[#b5ff4d]"}`} />
                    <span className={pkg.popular ? "text-gray-700" : "text-gray-300"}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={`/contact?service=${service.id}&package=${pkg.name.toLowerCase().replace(/ /g, "-")}`}
                className={`group flex items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold transition-all duration-200 ${
                  pkg.popular
                    ? "bg-black text-white hover:bg-gray-900"
                    : "bg-white/10 text-white hover:bg-white hover:text-black"
                }`}
              >
                {pkg.price === "Custom" ? "Let's Talk" : "Get Started"}
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 md:px-10 lg:px-20 py-20 border-b border-white/10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">• FAQ</p>
            <h2 className="font-almiregodisplay text-4xl md:text-5xl lg:text-6xl leading-tight mb-6">
              The answers to<br />your questions.
            </h2>
            <Link
              href="/contact"
              className="group inline-flex items-center gap-2 border border-white/20 text-white px-7 py-3 rounded-full text-sm font-medium hover:bg-white hover:text-black transition-all duration-200"
            >
              Get in touch
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
          <FaqAccordion faqs={faqs} />
        </div>
      </section>

      {/* Other Services */}
      <section className="px-6 md:px-10 lg:px-20 py-20 border-b border-white/10">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">• Explore More</p>
            <h2 className="text-2xl font-bold">Other services.</h2>
          </div>
          <Link
            href="/services"
            className="text-sm text-gray-500 hover:text-white transition-colors inline-flex items-center gap-1 group"
          >
            View all
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/10">
          {otherServices.map((s) => (
            <Link
              key={s.id}
              href={`/services/${s.id}`}
              className="group bg-black hover:bg-[#0d0d0d] transition-colors duration-300 p-8 flex flex-col justify-between min-h-[200px]"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold group-hover:text-[#b5ff4d] transition-colors duration-200">{s.label}</h3>
                <ArrowUpRight className="w-4 h-4 text-gray-700 group-hover:text-white transition-colors" />
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">{s.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 md:px-10 lg:px-20 py-24">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <h2 className="font-almiregodisplay text-5xl md:text-6xl lg:text-8xl leading-none tracking-tight">
            Let's work<br />together.
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 md:pb-2">
            <Link
              href={`/contact?service=${service.id}`}
              className="group inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-semibold hover:bg-[#b5ff4d] transition-colors duration-200"
            >
              Start a project
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
            <a
              href="mailto:zahid@lhrweb.com"
              className="group inline-flex items-center gap-2 border border-white/20 text-white px-8 py-4 rounded-full font-medium hover:border-white/60 transition-colors duration-200"
            >
              Send an email
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
