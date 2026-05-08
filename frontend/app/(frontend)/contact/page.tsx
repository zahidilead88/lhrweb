"use client";

import { useState } from "react";
import PageSections from "@/components/frontend/PageSections";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    service: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await new Promise((r) => setTimeout(r, 800));
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Admin-managed sections for this page */}
      <PageSections page="contact" />

      {/* Contact form — always shown */}
      <section className="px-6 md:px-10 lg:px-20 pt-16 pb-16 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-black block" />
          <span className="text-sm font-bold uppercase tracking-wider">Contact</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold leading-tight">
          Let&apos;s build <br /> something great.
        </h1>
      </section>

      <div className="px-6 md:px-10 lg:px-20 py-16 grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Form */}
        <div>
          {submitted ? (
            <div className="py-16">
              <h2 className="text-3xl font-bold mb-4">Message received!</h2>
              <p className="text-gray-500 text-lg">
                Thanks for reaching out. We&apos;ll get back to you within 24 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="Your name"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-black transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="your@email.com"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-black transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Phone</label>
                  <input
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+92 321 xxxxxxx"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-black transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Service</label>
                  <select
                    name="service"
                    value={form.service}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-black transition-colors bg-white"
                  >
                    <option value="">Select a service</option>
                    <option value="web-design">Web Design</option>
                    <option value="ecommerce">Ecommerce</option>
                    <option value="brand-identity">Brand Identity</option>
                    <option value="ui-ux">UI/UX Design</option>
                    <option value="seo-marketing">SEO & Marketing</option>
                    <option value="web-hosting">Web Hosting</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  placeholder="Tell us about your project..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-black transition-colors resize-none"
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-3 bg-black text-white px-8 py-4 rounded-full text-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {submitting ? "Sending..." : "Send Message"}
                {!submitting && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 14 14"
                    fill="none"
                  >
                    <path
                      d="M14 4.24128V0.471254C14 0.34627 13.9503 0.226405 13.862 0.138028C13.7736 0.0496505 13.6537 7.54619e-07 13.5287 7.54619e-07L9.75872 7.54619e-07C9.66539 -0.000166225 9.57411 0.0273818 9.49646 0.0791523C9.41881 0.130923 9.35828 0.204584 9.32254 0.290799C9.2868 0.377013 9.27747 0.471897 9.29572 0.563423C9.31398 0.654948 9.35899 0.738993 9.42507 0.804902L10.9774 2.35627L0 13.3327L0.667295 14L11.6437 3.02262L13.1951 4.57493C13.261 4.64101 13.3451 4.68602 13.4366 4.70428C13.5281 4.72253 13.623 4.7132 13.7092 4.67746C13.7954 4.64172 13.8691 4.58119 13.9208 4.50354C13.9726 4.42589 14.0002 4.33461 14 4.24128Z"
                      fill="white"
                    />
                  </svg>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Contact info */}
        <div className="lg:pl-10 space-y-10">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">
              Get in touch
            </h3>
            <div className="space-y-3">
              <a
                href="tel:+923214516195"
                className="flex items-center gap-3 text-lg hover:text-gray-600 transition-colors group"
              >
                <span className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center group-hover:border-black transition-colors">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 512 512">
                    <path d="M0 32L144 0l80 144-83.8 67c36.1 68.4 92.3 124.6 160.8 160.8l67-83.8 144 80-32 144h-32C200.6 512 0 311.4 0 64V32z" />
                  </svg>
                </span>
                +92 321 4516195
              </a>
              <a
                href="mailto:zahid@lhrweb.com"
                className="flex items-center gap-3 text-lg hover:text-gray-600 transition-colors group"
              >
                <span className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center group-hover:border-black transition-colors">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 512 512">
                    <path d="M0 64h512v80L256 320 0 144V64zm0 384V182.8l237.9 163.6 18.1 12.4 18.1-12.5L512 182.8V448H0z" />
                  </svg>
                </span>
                zahid@lhrweb.com
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">
              Location
            </h3>
            <p className="text-lg leading-relaxed text-gray-700">
              LHRWEB Digital<br />
              1-C, Block 1, Johar Town<br />
              Lahore, Pakistan
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">
              Follow us
            </h3>
            <div className="flex gap-4">
              {[
                { label: "Twitter", href: "https://twitter.com/lhrweb" },
                { label: "Instagram", href: "https://instagram.com/lhrweb" },
                { label: "LinkedIn", href: "https://linkedin.com/company/lhrweb" },
                { label: "Dribbble", href: "https://dribbble.com/lhrweb" },
              ].map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm border border-gray-200 rounded-full px-4 py-2 hover:border-black hover:bg-black hover:text-white transition-all"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
