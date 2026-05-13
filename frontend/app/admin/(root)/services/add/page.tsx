"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface ProcessStep { step: string; title: string; body: string }
interface Package { name: string; price: string; period: string; tagline: string; features: string; popular: boolean }

const emptyStep    = (): ProcessStep => ({ step: "", title: "", body: "" });
const emptyPackage = (): Package    => ({ name: "", price: "", period: "", tagline: "", features: "", popular: false });

export default function AddServicePage() {
  const router = useRouter();

  const [slug,            setSlug]            = useState("");
  const [label,           setLabel]           = useState("");
  const [headline,        setHeadline]        = useState("");
  const [description,     setDescription]     = useState("");
  const [longDescription, setLongDescription] = useState("");
  const [capabilities,    setCapabilities]    = useState<string[]>([""]);
  const [steps,           setSteps]           = useState<ProcessStep[]>([emptyStep()]);
  const [packages,        setPackages]        = useState<Package[]>([emptyPackage()]);
  const [saving,          setSaving]          = useState(false);
  const [error,           setError]           = useState<string | null>(null);

  const autoSlug = (val: string) => val.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const body = {
        slug, label, headline, description, longDescription,
        capabilities: capabilities.filter(Boolean),
        process: steps.filter((s) => s.title),
        packages: packages.filter((p) => p.name).map((p) => ({
          ...p,
          features: p.features.split("\n").map((f) => f.trim()).filter(Boolean),
        })),
      };
      const res = await fetch("http://localhost:8000/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const ct = res.headers.get("content-type") || "";
        const msg = ct.includes("json") ? (await res.json()).message : `Server error ${res.status}`;
        throw new Error(msg || "Failed to save");
      }
      router.push("/admin/services");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">New Offering</h1>
          <p className="text-[13px] text-gray-500 mt-2">
            Define a new service category, including its value proposition and pricing tiers.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-12">
        {/* Basic info */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-8">
          <div>
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-6">Phase 1: Brand & Identity</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Service Name <span className="text-red-500">*</span></label>
                <input 
                  className="w-full px-5 py-3 bg-gray-50/50 border border-gray-100 rounded-2xl text-[14px] font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all" 
                  placeholder="e.g. Identity Design"
                  value={label} 
                  onChange={(e) => { setLabel(e.target.value); if (!slug) setSlug(autoSlug(e.target.value)); }} 
                  required 
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">URL Identifier <span className="text-red-500">*</span></label>
                <input 
                  className="w-full px-5 py-3 bg-gray-50/50 border border-gray-100 rounded-2xl text-[14px] font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all" 
                  placeholder="e.g. identity-design"
                  value={slug} 
                  onChange={(e) => setSlug(autoSlug(e.target.value))} 
                  required 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Marketing Headline</label>
                <input 
                  className="w-full px-5 py-3 bg-gray-50/50 border border-gray-100 rounded-2xl text-[14px] font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all" 
                  placeholder="e.g. Brands that resonate with purpose."
                  value={headline} 
                  onChange={(e) => setHeadline(e.target.value)} 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Elevator Pitch (Short)</label>
                <textarea 
                  className="w-full px-5 py-3 bg-gray-50/50 border border-gray-100 rounded-2xl text-[14px] focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all" 
                  rows={2}
                  placeholder="Briefly describe the value proposition..."
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Detailed Manifesto</label>
                <textarea 
                  className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-[14px] leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all" 
                  rows={5}
                  placeholder="Deep dive into the service philosophy and delivery..."
                  value={longDescription} 
                  onChange={(e) => setLongDescription(e.target.value)} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Capabilities & Process */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Capabilities</h3>
              <button type="button" onClick={() => setCapabilities([...capabilities, ""])} className="text-[11px] font-bold text-black hover:opacity-70">+ Add New</button>
            </div>
            <div className="space-y-3">
              {capabilities.map((cap, i) => (
                <div key={i} className="flex gap-2 group">
                  <input 
                    className="flex-1 px-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl text-[13px] font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all" 
                    placeholder="e.g. Brand Strategy"
                    value={cap} 
                    onChange={(e) => { const next = [...capabilities]; next[i] = e.target.value; setCapabilities(next); }} 
                  />
                  <button 
                    type="button" 
                    onClick={() => setCapabilities(capabilities.filter((_, j) => j !== i))}
                    className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >✕</button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Workflow Steps</h3>
              <button type="button" onClick={() => setSteps([...steps, emptyStep()])} className="text-[11px] font-bold text-black hover:opacity-70">+ Add Phase</button>
            </div>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
              {steps.map((step, i) => (
                <div key={i} className="group p-5 bg-gray-50/50 border border-gray-100 rounded-2xl space-y-3 relative">
                  <div className="flex gap-3">
                    <input 
                      className="w-14 px-2 py-2 bg-white border border-gray-100 rounded-lg text-[12px] font-mono text-center focus:outline-none focus:ring-2 focus:ring-black/5" 
                      placeholder="01"
                      value={step.step} 
                      onChange={(e) => { const n = [...steps]; n[i].step = e.target.value; setSteps(n); }} 
                    />
                    <input 
                      className="flex-1 px-4 py-2 bg-white border border-gray-100 rounded-lg text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-black/5" 
                      placeholder="Phase Title"
                      value={step.title} 
                      onChange={(e) => { const n = [...steps]; n[i].title = e.target.value; setSteps(n); }} 
                    />
                    <button 
                      type="button" 
                      onClick={() => setSteps(steps.filter((_, j) => j !== i))}
                      className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-colors"
                    >✕</button>
                  </div>
                  <textarea 
                    className="w-full px-4 py-2 bg-white border border-gray-100 rounded-lg text-[12px] focus:outline-none focus:ring-2 focus:ring-black/5" 
                    rows={2} 
                    placeholder="Describe this phase of the project..."
                    value={step.body} 
                    onChange={(e) => { const n = [...steps]; n[i].body = e.target.value; setSteps(n); }} 
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Packages */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Pricing Strategy</h3>
            <button type="button" onClick={() => setPackages([...packages, emptyPackage()])} className="text-[11px] font-bold text-black hover:opacity-70">+ Add Tier</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {packages.map((pkg, i) => (
              <div key={i} className="group p-8 bg-gray-50/50 border border-gray-100 rounded-[2.5rem] space-y-6 relative overflow-hidden transition-all hover:bg-white hover:shadow-xl hover:shadow-black/5">
                {pkg.popular && (
                  <div className="absolute top-6 right-6 bg-black text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                    Featured
                  </div>
                )}
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <span className="text-[11px] font-bold text-gray-300 uppercase tracking-widest">Tier 0{i + 1}</span>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        className="w-3 h-3 rounded border-gray-300 accent-black"
                        checked={pkg.popular}
                        onChange={(e) => { const n = [...packages]; n[i].popular = e.target.checked; setPackages(n); }} 
                      />
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Feature this</span>
                    </label>
                    <button 
                      type="button" 
                      onClick={() => setPackages(packages.filter((_, j) => j !== i))}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                    >✕</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <input 
                    className="w-full px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-[14px] font-bold focus:outline-none focus:ring-2 focus:ring-black/5" 
                    placeholder="Plan Name (e.g. Starter)"
                    value={pkg.name} 
                    onChange={(e) => { const n = [...packages]; n[i].name = e.target.value; setPackages(n); }} 
                  />
                  <input 
                    className="w-full px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-black/5" 
                    placeholder="Value Tagline (e.g. Perfect for small startups)"
                    value={pkg.tagline} 
                    onChange={(e) => { const n = [...packages]; n[i].tagline = e.target.value; setPackages(n); }} 
                  />
                  <div className="flex gap-3">
                    <input 
                      className="flex-1 px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-[14px] font-mono focus:outline-none focus:ring-2 focus:ring-black/5" 
                      placeholder="Price (e.g. $4,500)"
                      value={pkg.price} 
                      onChange={(e) => { const n = [...packages]; n[i].price = e.target.value; setPackages(n); }} 
                    />
                    <input 
                      className="flex-1 px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-[14px] font-mono focus:outline-none focus:ring-2 focus:ring-black/5" 
                      placeholder="Period (e.g. / project)"
                      value={pkg.period} 
                      onChange={(e) => { const n = [...packages]; n[i].period = e.target.value; setPackages(n); }} 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-3 ml-1">Key Features (One per line)</label>
                  <textarea 
                    className="w-full px-4 py-4 bg-white border border-gray-100 rounded-2xl text-[12px] leading-loose focus:outline-none focus:ring-2 focus:ring-black/5" 
                    rows={6} 
                    placeholder={"Custom Design\n3 Rounds of Revisions\nFull Handover..."}
                    value={pkg.features} 
                    onChange={(e) => { const n = [...packages]; n[i].features = e.target.value; setPackages(n); }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-[13px] text-red-600 font-medium">
            {error}
          </div>
        )}

        <div className="flex gap-4 pt-4 pb-20">
          <button 
            type="submit" 
            disabled={saving}
            className="flex-1 bg-black text-white px-8 py-4 rounded-2xl text-[14px] font-bold hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            {saving ? "Deploying offering..." : "Publish Service"}
          </button>
          <button 
            type="button" 
            onClick={() => router.push("/admin/services")}
            className="px-8 py-4 bg-gray-50 text-gray-500 rounded-2xl text-[14px] font-bold hover:bg-gray-100 transition-all"
          >
            Discard
          </button>
        </div>
      </form>
    </div> </div>
  );
}
