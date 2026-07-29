"use client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
import { useState } from "react";
import { useRouter } from "next/navigation";

const INPUT: React.CSSProperties = { background: "#111111", border: "1px solid rgba(255,255,255,0.1)", color: "#e8eaed", borderRadius: 10, padding: "10px 14px", fontSize: 13, width: "100%", outline: "none" };
const LABEL: React.CSSProperties = { color: "#9aa0a6", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 };
function iFocus(e: React.FocusEvent<HTMLInputElement>) { e.currentTarget.style.borderColor = "rgba(168,199,250,0.5)"; }
function iBlur (e: React.FocusEvent<HTMLInputElement>) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }

export default function AddMenuPage() {
  const [title, setTitle]       = useState("");
  const [url, setUrl]           = useState("");
  const [sublinks, setSublinks] = useState([{ title: "", url: "" }]);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`${API}/api/menu`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, url, sublinks }) });
    router.push("/admin/menu");
  };

  const changeSubLink = (i: number, f: "title" | "url", v: string) => {
    const u = [...sublinks]; u[i][f] = v; setSublinks(u);
  };
  const addSubLink    = () => setSublinks([...sublinks, { title: "", url: "" }]);
  const removeSubLink = (i: number) => {
    const u = sublinks.filter((_, j) => j !== i);
    setSublinks(u.length ? u : [{ title: "", url: "" }]);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold mb-1" style={{ color: "#e8eaed" }}>New Navigation Link</h1>
        <p className="text-[13px]" style={{ color: "#9aa0a6" }}>Create a new item for your website&apos;s main menu.</p>
      </div>

      <div style={{ background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }} className="overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label style={LABEL}>Display Title</label>
            <input style={INPUT} placeholder="e.g. Services" value={title} onChange={(e) => setTitle(e.target.value)} required onFocus={iFocus} onBlur={iBlur} />
          </div>
          <div>
            <label style={LABEL}>Link URL</label>
            <input style={{ ...INPUT, fontFamily: "monospace" }} placeholder="e.g. /services" value={url} onChange={(e) => setUrl(e.target.value)} required onFocus={iFocus} onBlur={iBlur} />
          </div>

          <div className="pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center justify-between mb-4">
              <label style={{ ...LABEL, marginBottom: 0 }}>Dropdown Sub-links</label>
              <button type="button" onClick={addSubLink}
                className="text-[12px] font-semibold transition-colors" style={{ color: "#a8c7fa" }}>
                + Add Row
              </button>
            </div>
            <div className="space-y-3">
              {sublinks.map((sub, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <input style={{ ...INPUT, flex: 1 }} placeholder="Label" value={sub.title}
                    onChange={(e) => changeSubLink(i, "title", e.target.value)} onFocus={iFocus} onBlur={iBlur} />
                  <input style={{ ...INPUT, flex: 1, fontFamily: "monospace" }} placeholder="URL" value={sub.url}
                    onChange={(e) => changeSubLink(i, "url", e.target.value)} onFocus={iFocus} onBlur={iBlur} />
                  <button type="button" onClick={() => removeSubLink(i)}
                    className="text-[18px] w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0 transition-colors"
                    style={{ color: "rgba(255,255,255,0.2)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#f28b82")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <button type="submit"
              className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold"
              style={{ background: "#a8c7fa", color: "#111111" }}>
              Add to Menu
            </button>
            <button type="button" onClick={() => router.push("/admin/menu")}
              className="px-5 py-2.5 rounded-xl text-[13px] font-semibold"
              style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#9aa0a6" }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
