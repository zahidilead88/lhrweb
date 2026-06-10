"use client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ProcessStep { step: string; title: string; body: string }
interface Package { name: string; price: string; period: string; tagline: string; features: string; popular: boolean }

const emptyStep    = (): ProcessStep => ({ step: "", title: "", body: "" });
const emptyPackage = (): Package    => ({ name: "", price: "", period: "", tagline: "", features: "", popular: false });

const INPUT:   React.CSSProperties = { background: "#111111", border: "1px solid rgba(255,255,255,0.1)", color: "#e8eaed", borderRadius: 10, padding: "10px 14px", fontSize: 13, width: "100%", outline: "none" };
const LABEL:   React.CSSProperties = { color: "#9aa0a6", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 };
const SURFACE: React.CSSProperties = { background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 };
const SECTION_HEAD: React.CSSProperties = { color: "#9aa0a6", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" };
function iF(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) { e.currentTarget.style.borderColor = "rgba(168,199,250,0.5)"; }
function iB(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }

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
  const [imageFile,       setImageFile]       = useState<File | null>(null);
  const [imagePreview,    setImagePreview]    = useState<string | null>(null);
  const [saving,          setSaving]          = useState(false);
  const [error,           setError]           = useState<string | null>(null);

  const autoSlug = (v: string) => v.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError(null);
    try {
      const fd = new FormData();
      fd.append("slug", slug);
      fd.append("label", label);
      fd.append("headline", headline);
      fd.append("description", description);
      fd.append("longDescription", longDescription);
      fd.append("capabilities", JSON.stringify(capabilities.filter(Boolean)));
      fd.append("process", JSON.stringify(steps.filter((s) => s.title)));
      fd.append("packages", JSON.stringify(
        packages.filter((p) => p.name).map((p) => ({
          ...p, features: p.features.split("\n").map((f) => f.trim()).filter(Boolean),
        }))
      ));
      if (imageFile) fd.append("image", imageFile);
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API}/api/services`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
      if (!res.ok) {
        const ct = res.headers.get("content-type") || "";
        throw new Error(ct.includes("json") ? (await res.json()).message : `Server error ${res.status}`);
      }
      router.push("/admin/services");
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed to save"); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold mb-1" style={{ color: "#e8eaed" }}>New Offering</h1>
        <p className="text-[13px]" style={{ color: "#9aa0a6" }}>Define a new service category, value proposition, and pricing tiers.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic info */}
        <div style={SURFACE} className="p-6 space-y-5">
          <p style={SECTION_HEAD}>Identity & Positioning</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label style={LABEL}>Service Name</label>
              <input style={INPUT} placeholder="e.g. Identity Design" value={label}
                onChange={(e) => { setLabel(e.target.value); if (!slug) setSlug(autoSlug(e.target.value)); }} required onFocus={iF} onBlur={iB} />
            </div>
            <div>
              <label style={LABEL}>URL Identifier</label>
              <input style={{ ...INPUT, fontFamily: "monospace" }} placeholder="e.g. identity-design" value={slug}
                onChange={(e) => setSlug(autoSlug(e.target.value))} required onFocus={iF} onBlur={iB} />
            </div>
            <div className="md:col-span-2">
              <label style={LABEL}>Marketing Headline</label>
              <input style={INPUT} placeholder="e.g. Brands that resonate with purpose." value={headline}
                onChange={(e) => setHeadline(e.target.value)} onFocus={iF} onBlur={iB} />
            </div>
            <div className="md:col-span-2">
              <label style={LABEL}>Short Description</label>
              <textarea style={{ ...INPUT, resize: "vertical" }} rows={2} placeholder="Brief value proposition..."
                value={description} onChange={(e) => setDescription(e.target.value)} onFocus={iF} onBlur={iB} />
            </div>
            <div className="md:col-span-2">
              <label style={LABEL}>Detailed Description</label>
              <textarea style={{ ...INPUT, resize: "vertical" }} rows={5} placeholder="In-depth service philosophy and delivery..."
                value={longDescription} onChange={(e) => setLongDescription(e.target.value)} onFocus={iF} onBlur={iB} />
            </div>
            <div className="md:col-span-2">
              <label style={LABEL}>Banner Image</label>
              <div style={{ border: "1px dashed rgba(255,255,255,0.15)", borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                {imagePreview && (
                  <img src={imagePreview} alt="preview" style={{ width: 80, height: 52, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <input type="file" accept="image/*" style={{ display: "none" }} id="svc-img-add"
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      setImageFile(f);
                      setImagePreview(f ? URL.createObjectURL(f) : null);
                    }} />
                  <label htmlFor="svc-img-add" style={{ cursor: "pointer", color: "#a8c7fa", fontSize: 12, fontWeight: 600 }}>
                    {imageFile ? imageFile.name : "Choose image…"}
                  </label>
                  {imageFile && (
                    <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }}
                      style={{ display: "block", color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 4 }}>Remove</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Capabilities + Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div style={SURFACE} className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p style={SECTION_HEAD}>Capabilities</p>
              <button type="button" onClick={() => setCapabilities([...capabilities, ""])}
                className="text-[12px] font-semibold" style={{ color: "#a8c7fa" }}>+ Add</button>
            </div>
            <div className="space-y-2">
              {capabilities.map((cap, i) => (
                <div key={i} className="flex gap-2">
                  <input style={{ ...INPUT, flex: 1 }} placeholder="e.g. Brand Strategy" value={cap}
                    onChange={(e) => { const n = [...capabilities]; n[i] = e.target.value; setCapabilities(n); }} onFocus={iF} onBlur={iB} />
                  <button type="button" onClick={() => setCapabilities(capabilities.filter((_, j) => j !== i))}
                    className="w-8 h-10 flex items-center justify-center rounded-lg text-[16px] flex-shrink-0 transition-colors"
                    style={{ color: "rgba(255,255,255,0.2)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#f28b82")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")}>×</button>
                </div>
              ))}
            </div>
          </div>

          <div style={SURFACE} className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p style={SECTION_HEAD}>Workflow Steps</p>
              <button type="button" onClick={() => setSteps([...steps, emptyStep()])}
                className="text-[12px] font-semibold" style={{ color: "#a8c7fa" }}>+ Add Phase</button>
            </div>
            <div className="space-y-3 max-h-[380px] overflow-y-auto">
              {steps.map((step, i) => (
                <div key={i} className="p-4 rounded-xl space-y-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex gap-2 items-center">
                    <input style={{ ...INPUT, width: 48, textAlign: "center", fontFamily: "monospace", padding: "8px 4px" }}
                      placeholder="01" value={step.step}
                      onChange={(e) => { const n = [...steps]; n[i].step = e.target.value; setSteps(n); }} onFocus={iF} onBlur={iB} />
                    <input style={{ ...INPUT, flex: 1 }} placeholder="Phase Title" value={step.title}
                      onChange={(e) => { const n = [...steps]; n[i].title = e.target.value; setSteps(n); }} onFocus={iF} onBlur={iB} />
                    <button type="button" onClick={() => setSteps(steps.filter((_, j) => j !== i))}
                      className="text-[16px] w-8 flex items-center justify-center flex-shrink-0 transition-colors"
                      style={{ color: "rgba(255,255,255,0.2)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#f28b82")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")}>×</button>
                  </div>
                  <textarea style={{ ...INPUT, resize: "vertical" }} rows={2} placeholder="Describe this phase..."
                    value={step.body} onChange={(e) => { const n = [...steps]; n[i].body = e.target.value; setSteps(n); }} onFocus={iF} onBlur={iB} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Packages */}
        <div style={SURFACE} className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <p style={SECTION_HEAD}>Pricing Tiers</p>
            <button type="button" onClick={() => setPackages([...packages, emptyPackage()])}
              className="text-[12px] font-semibold" style={{ color: "#a8c7fa" }}>+ Add Tier</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {packages.map((pkg, i) => (
              <div key={i} className="p-5 rounded-xl space-y-4 relative" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${pkg.popular ? "rgba(168,199,250,0.3)" : "rgba(255,255,255,0.08)"}` }}>
                {pkg.popular && (
                  <span className="absolute top-4 right-4 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(168,199,250,0.15)", color: "#a8c7fa" }}>Featured</span>
                )}
                <div className="flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 12 }}>
                  <span className="text-[11px] font-bold" style={{ color: "#5f6368" }}>Tier 0{i + 1}</span>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" checked={pkg.popular}
                        onChange={(e) => { const n = [...packages]; n[i].popular = e.target.checked; setPackages(n); }} />
                      <span className="text-[10px] font-semibold uppercase" style={{ color: "#9aa0a6" }}>Feature this</span>
                    </label>
                    <button type="button" onClick={() => setPackages(packages.filter((_, j) => j !== i))}
                      className="text-[16px] transition-colors" style={{ color: "rgba(255,255,255,0.2)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#f28b82")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")}>×</button>
                  </div>
                </div>
                <div className="space-y-3">
                  <input style={INPUT} placeholder="Plan Name (e.g. Starter)" value={pkg.name}
                    onChange={(e) => { const n = [...packages]; n[i].name = e.target.value; setPackages(n); }} onFocus={iF} onBlur={iB} />
                  <input style={INPUT} placeholder="Value Tagline" value={pkg.tagline}
                    onChange={(e) => { const n = [...packages]; n[i].tagline = e.target.value; setPackages(n); }} onFocus={iF} onBlur={iB} />
                  <div className="flex gap-3">
                    <input style={{ ...INPUT, fontFamily: "monospace" }} placeholder="Price (e.g. $4,500)" value={pkg.price}
                      onChange={(e) => { const n = [...packages]; n[i].price = e.target.value; setPackages(n); }} onFocus={iF} onBlur={iB} />
                    <input style={{ ...INPUT, fontFamily: "monospace" }} placeholder="Period (e.g. / project)" value={pkg.period}
                      onChange={(e) => { const n = [...packages]; n[i].period = e.target.value; setPackages(n); }} onFocus={iF} onBlur={iB} />
                  </div>
                </div>
                <div>
                  <label style={{ ...LABEL, marginBottom: 6 }}>Features (one per line)</label>
                  <textarea style={{ ...INPUT, resize: "vertical", lineHeight: 1.8 }} rows={5}
                    placeholder={"Custom Design\n3 Rounds of Revisions\nFull Handover..."} value={pkg.features}
                    onChange={(e) => { const n = [...packages]; n[i].features = e.target.value; setPackages(n); }} onFocus={iF} onBlur={iB} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl text-[12px] flex items-center gap-2" style={{ background: "rgba(234,67,53,0.1)", border: "1px solid rgba(234,67,53,0.2)", color: "#f28b82" }}>
            <span className="w-4 h-4 flex items-center justify-center rounded-full text-[10px] flex-shrink-0" style={{ background: "rgba(234,67,53,0.2)" }}>!</span>{error}
          </div>
        )}

        <div className="flex gap-3 pb-10">
          <button type="submit" disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold"
            style={{ background: "#a8c7fa", color: "#111111" }}>
            {saving ? "Saving…" : "Publish Service"}
          </button>
          <button type="button" onClick={() => router.push("/admin/services")}
            className="px-5 py-2.5 rounded-xl text-[13px] font-semibold"
            style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#9aa0a6" }}>
            Discard
          </button>
        </div>
      </form>
    </div>
  );
}
