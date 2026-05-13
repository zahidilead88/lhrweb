"use client";
import { useState } from "react";

export default function ContactForm() {
  const [form, setForm]           = useState({ name: "", email: "", phone: "", service: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [error, setError]           = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("http://localhost:8000/api/leads", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
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

  return (
    <div className="min-h-screen bg-white text-black">
      <section className="px-6 md:px-10 lg:px-20 pt-16 pb-16 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-black block" />
          <span className="text-sm font-bold uppercase tracking-wider">Contact</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold leading-tight">Let&apos;s build <br /> something great.</h1>
      </section>

      <div className="px-6 md:px-10 lg:px-20 py-16 grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div>
          {submitted ? (
            <div className="py-16">
              <h2 className="text-3xl font-bold mb-4">Message received!</h2>
              <p className="text-gray-500 text-lg">Thanks for reaching out. We&apos;ll get back to you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Name <span className="text-red-500">*</span></label>
                  <input name="name" value={form.name} onChange={handleChange} required placeholder="Your name"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-black transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Email <span className="text-red-500">*</span></label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="your@email.com"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-black transition-colors" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Phone</label>
                  <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="+92 321 xxxxxxx"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-black transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Service</label>
                  <select name="service" value={form.service} onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-black transition-colors bg-white">
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
                <label className="block text-sm font-semibold mb-2">Message <span className="text-red-500">*</span></label>
                <textarea name="message" value={form.message} onChange={handleChange} required rows={6}
                  placeholder="Tell us about your project..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-black transition-colors resize-none" />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" disabled={submitting}
                className="inline-flex items-center gap-3 bg-black text-white px-8 py-4 rounded-full text-lg hover:bg-gray-800 disabled:opacity-50 transition-colors">
                {submitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          )}
        </div>

        <div className="lg:pl-10 space-y-10">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Get in touch</h3>
            <div className="space-y-3">
              <a href="tel:+923214516195" className="flex items-center gap-3 text-lg hover:text-gray-600 transition-colors">
                <span className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center">📞</span>
                +92 321 4516195
              </a>
              <a href="mailto:hello@lhrweb.com" className="flex items-center gap-3 text-lg hover:text-gray-600 transition-colors">
                <span className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center">✉️</span>
                hello@lhrweb.com
              </a>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Location</h3>
            <p className="text-lg leading-relaxed text-gray-700">LHRWEB Digital<br />1-C, Block 1, Johar Town<br />Lahore, Pakistan</p>
          </div>
        </div>
      </div>
    </div>
  );
}
