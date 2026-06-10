"use client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";


import React, { useState, useEffect } from "react";

export default function LeadPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", service: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setSubmitted(false);
      setError("");
      setForm({ name: "", email: "", phone: "", service: "", message: "" });
    };

    window.addEventListener("open-lead-popup", handleOpen);
    return () => window.removeEventListener("open-lead-popup", handleOpen);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Server error");
      }
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop blur overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-white text-black rounded-3xl border border-gray-100 shadow-2xl p-8 md:p-10 z-10 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 no-scrollbar">
        
        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-6 right-6 w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:text-black hover:border-gray-300 transition-all font-light text-xl"
          type="button"
        >
          ✕
        </button>

        {submitted ? (
          <div className="text-center py-12 space-y-4">
            <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto text-3xl">✓</div>
            <h2 className="heading text-3xl font-bold">Thank you!</h2>
            <p className="text-gray-500 text-base max-w-md mx-auto">
              Your inquiry has been successfully received. We will get back to you within 24 hours.
            </p>
            <button
              onClick={() => setIsOpen(false)}
              className="mt-6 bg-black text-white px-8 py-3 rounded-xl text-[13px] font-bold hover:bg-gray-800 transition-all"
            >
              Close Window
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-black block" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Get in touch</span>
              </div>
              <h2 className="heading text-2xl md:text-3xl font-bold tracking-tight">Let&apos;s build something great together.</h2>
              <p className="text-xs text-gray-400 mt-1">Fill out the details below and we will contact you shortly.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Name <span className="text-red-500">*</span></label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="Your name"
                    className="w-full border border-gray-100 rounded-2xl px-5 py-3.5 bg-gray-50/50 text-[13px] font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Email <span className="text-red-500">*</span></label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="your@email.com"
                    className="w-full border border-gray-100 rounded-2xl px-5 py-3.5 bg-gray-50/50 text-[13px] font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Phone</label>
                  <input
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+92 321 xxxxxxx"
                    className="w-full border border-gray-100 rounded-2xl px-5 py-3.5 bg-gray-50/50 text-[13px] font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Service</label>
                  <select
                    name="service"
                    value={form.service}
                    onChange={handleChange}
                    className="w-full border border-gray-100 rounded-2xl px-5 py-3.5 bg-gray-50/50 text-[13px] font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Select a service</option>
                    <option value="web-design">Web Design</option>
                    <option value="web-development">Web Development</option>
                    <option value="ecommerce">Ecommerce</option>
                    <option value="brand-identity">Brand Identity</option>
                    <option value="ui-ux">UI/UX Design</option>
                    <option value="seo-marketing">SEO & Marketing</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Message <span className="text-red-500">*</span></label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  required
                  rows={4}
                  placeholder="Tell us about your project..."
                  className="w-full border border-gray-100 rounded-2xl px-5 py-3.5 bg-gray-50/50 text-[13px] leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all resize-none"
                />
              </div>

              {error && <p className="text-red-500 text-xs font-semibold ml-1">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-black text-white py-4 rounded-2xl text-[14px] font-bold hover:bg-gray-800 disabled:opacity-50 transition-all shadow-sm"
              >
                {submitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
