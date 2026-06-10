"use client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
import { useEffect, useState } from "react";

interface FooterLink { title: string; url: string; }
interface FooterData {
  sitemapLinks: FooterLink[]; servicesLinks: FooterLink[]; socialLinks: FooterLink[];
  phone: string; email: string; address: string; companyName: string;
  craftingText: string; privacyPolicyUrl: string; copyrightText: string;
}

const SURFACE: React.CSSProperties = { background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 };
const INPUT:   React.CSSProperties = { background: "#111111", border: "1px solid rgba(255,255,255,0.1)", color: "#e8eaed", borderRadius: 10, padding: "10px 14px", fontSize: 13, width: "100%", outline: "none" };
const LABEL:   React.CSSProperties = { color: "#9aa0a6", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 };

function iFocus(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) { e.currentTarget.style.borderColor = "rgba(168,199,250,0.5)"; }
function iBlur (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }

function LinkGroup({ title, listKey, links, onAdd, onChange, onRemove }: {
  title: string; listKey: string;
  links: FooterLink[];
  onAdd: () => void;
  onChange: (idx: number, field: "title" | "url", val: string) => void;
  onRemove: (idx: number) => void;
}) {
  return (
    <div style={SURFACE} className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p style={{ ...LABEL, marginBottom: 0 }}>{title}</p>
        <button type="button" onClick={onAdd}
          className="text-[12px] px-3 py-1 rounded-lg transition-colors font-semibold"
          style={{ background: "rgba(168,199,250,0.1)", color: "#a8c7fa", border: "1px solid rgba(168,199,250,0.2)" }}>
          + Add
        </button>
      </div>
      {links.length === 0 && <p className="text-[12px] text-center py-4" style={{ color: "#5f6368" }}>No links added yet.</p>}
      <div className="space-y-3">
        {links.map((link, idx) => (
          <div key={idx} className="flex gap-2 items-center">
            <input style={{ ...INPUT, flex: 1 }} placeholder="Label" value={link.title}
              onChange={(e) => onChange(idx, "title", e.target.value)} onFocus={iFocus} onBlur={iBlur} required />
            <input style={{ ...INPUT, flex: 1, fontFamily: "monospace" }} placeholder="URL" value={link.url}
              onChange={(e) => onChange(idx, "url", e.target.value)} onFocus={iFocus} onBlur={iBlur} required />
            <button type="button" onClick={() => onRemove(idx)}
              className="text-[16px] w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0 transition-colors"
              style={{ color: "rgba(255,255,255,0.2)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#f28b82")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")}>
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FooterSettingsPage() {
  const [data, setData]       = useState<FooterData>({ sitemapLinks: [], servicesLinks: [], socialLinks: [], phone: "", email: "", address: "", companyName: "", craftingText: "", privacyPolicyUrl: "", copyrightText: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/footer`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setError("Failed to load footer settings"))
      .finally(() => setLoading(false));
  }, []);

  const setText = (key: keyof Omit<FooterData, "sitemapLinks" | "servicesLinks" | "socialLinks">, val: string) =>
    setData((prev) => ({ ...prev, [key]: val }));

  const changeLink = (listKey: "sitemapLinks" | "servicesLinks" | "socialLinks", idx: number, field: "title" | "url", val: string) =>
    setData((prev) => { const l = [...prev[listKey]]; l[idx] = { ...l[idx], [field]: val }; return { ...prev, [listKey]: l }; });

  const addLink    = (k: "sitemapLinks" | "servicesLinks" | "socialLinks") =>
    setData((prev) => ({ ...prev, [k]: [...prev[k], { title: "", url: "" }] }));

  const removeLink = (k: "sitemapLinks" | "servicesLinks" | "socialLinks", idx: number) =>
    setData((prev) => ({ ...prev, [k]: prev[k].filter((_, i) => i !== idx) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null); setSuccess(false);
    try {
      const res = await fetch(`${API}/api/footer`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (res.ok) { setSuccess(true); setTimeout(() => setSuccess(false), 3000); }
      else throw new Error("Failed to update footer");
    } catch { setError("Failed to save footer settings"); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(255,255,255,0.1)", borderTopColor: "#a8c7fa" }} />
    </div>
  );

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold mb-1" style={{ color: "#e8eaed" }}>Manage Footer</h1>
        <p className="text-[13px]" style={{ color: "#9aa0a6" }}>Configure contact info, navigation links, and social profiles.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact & General */}
            <div style={SURFACE} className="p-6 space-y-5">
              <h2 className="text-[13px] font-semibold" style={{ color: "#e8eaed" }}>General & Contact</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label style={LABEL}>Phone</label><input style={INPUT} value={data.phone} onChange={(e) => setText("phone", e.target.value)} placeholder="+92 321 451 6195" required onFocus={iFocus} onBlur={iBlur} /></div>
                <div><label style={LABEL}>Email</label><input type="email" style={INPUT} value={data.email} onChange={(e) => setText("email", e.target.value)} placeholder="hello@example.com" required onFocus={iFocus} onBlur={iBlur} /></div>
              </div>
              <div><label style={LABEL}>Address</label><textarea style={{ ...INPUT, resize: "vertical" }} rows={3} value={data.address} onChange={(e) => setText("address", e.target.value)} placeholder="Street lines (one per line)..." required onFocus={iFocus} onBlur={iBlur} /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div><label style={LABEL}>Company Name</label><input style={INPUT} value={data.companyName} onChange={(e) => setText("companyName", e.target.value)} placeholder="Made By LHRWEB Ltd 2025" required onFocus={iFocus} onBlur={iBlur} /></div>
                <div><label style={LABEL}>Crafting Since Text</label><input style={INPUT} value={data.craftingText} onChange={(e) => setText("craftingText", e.target.value)} placeholder="Crafting since 2023" required onFocus={iFocus} onBlur={iBlur} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label style={LABEL}>Privacy Policy URL</label><input style={INPUT} value={data.privacyPolicyUrl} onChange={(e) => setText("privacyPolicyUrl", e.target.value)} placeholder="https://…/privacy" required onFocus={iFocus} onBlur={iBlur} /></div>
                <div><label style={LABEL}>Copyright Text</label><input style={INPUT} value={data.copyrightText} onChange={(e) => setText("copyrightText", e.target.value)} placeholder="All Rights Reserved" required onFocus={iFocus} onBlur={iBlur} /></div>
              </div>
            </div>

            {/* Sitemap links */}
            <LinkGroup title="Sitemap Links" listKey="sitemapLinks" links={data.sitemapLinks}
              onAdd={() => addLink("sitemapLinks")}
              onChange={(i, f, v) => changeLink("sitemapLinks", i, f, v)}
              onRemove={(i) => removeLink("sitemapLinks", i)} />
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            <LinkGroup title="Services Links" listKey="servicesLinks" links={data.servicesLinks}
              onAdd={() => addLink("servicesLinks")}
              onChange={(i, f, v) => changeLink("servicesLinks", i, f, v)}
              onRemove={(i) => removeLink("servicesLinks", i)} />

            <LinkGroup title="Social Media" listKey="socialLinks" links={data.socialLinks}
              onAdd={() => addLink("socialLinks")}
              onChange={(i, f, v) => changeLink("socialLinks", i, f, v)}
              onRemove={(i) => removeLink("socialLinks", i)} />
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl text-[12px] flex items-center gap-2" style={{ background: "rgba(234,67,53,0.1)", border: "1px solid rgba(234,67,53,0.2)", color: "#f28b82" }}>
            <span className="w-4 h-4 flex items-center justify-center rounded-full text-[10px] flex-shrink-0" style={{ background: "rgba(234,67,53,0.2)" }}>!</span>{error}
          </div>
        )}
        {success && (
          <div className="px-4 py-3 rounded-xl text-[12px] flex items-center gap-2" style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)", color: "#34d399" }}>
            <span className="w-4 h-4 flex items-center justify-center rounded-full text-[10px] flex-shrink-0" style={{ background: "rgba(52,211,153,0.2)" }}>✓</span>Footer saved successfully!
          </div>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="flex-1 py-3 rounded-xl text-[13px] font-semibold"
            style={{ background: "#a8c7fa", color: "#111111" }}>
            {saving ? "Saving…" : "Save Footer Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
