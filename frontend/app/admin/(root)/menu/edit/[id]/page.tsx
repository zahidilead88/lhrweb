"use client";

const API = process.env.NEXT_PUBLIC_API_URL || `${API}`;
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const INPUT: React.CSSProperties = { background: "#111111", border: "1px solid rgba(255,255,255,0.1)", color: "#e8eaed", borderRadius: 10, padding: "10px 14px", fontSize: 13, width: "100%", outline: "none" };
const LABEL: React.CSSProperties = { color: "#9aa0a6", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 };
function iFocus(e: React.FocusEvent<HTMLInputElement>) { e.currentTarget.style.borderColor = "rgba(168,199,250,0.5)"; }
function iBlur (e: React.FocusEvent<HTMLInputElement>) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }

export default function EditMenuPage() {
  const { id } = useParams();
  const router = useRouter();

  const [title, setTitle]       = useState("");
  const [url, setUrl]           = useState("");
  const [sublinks, setSublinks] = useState([{ title: "", url: "" }]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetch(`${API}/api/menu/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setTitle(data.title || "");
        setUrl(data.url || "");
        setSublinks(
          Array.isArray(data.sublinks) && data.sublinks.length > 0
            ? data.sublinks
            : [{ title: "", url: "" }]
        );
      })
      .catch((err) => console.error("Failed to fetch menu data", err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${API}/api/menu/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, url, sublinks }),
    });
    if (res.ok) router.push("/admin/menu");
    else alert("Failed to update menu");
  };

  const changeSubLink = (i: number, f: "title" | "url", v: string) => {
    const u = [...sublinks]; u[i][f] = v; setSublinks(u);
  };
  const addSubLink    = () => setSublinks([...sublinks, { title: "", url: "" }]);
  const removeSubLink = (i: number) => {
    const u = sublinks.filter((_, j) => j !== i);
    setSublinks(u.length ? u : [{ title: "", url: "" }]);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(255,255,255,0.1)", borderTopColor: "#a8c7fa" }} />
    </div>
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold mb-1" style={{ color: "#e8eaed" }}>Edit Navigation Link</h1>
        <p className="text-[13px]" style={{ color: "#9aa0a6" }}>Update the properties of your menu item.</p>
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
              Save Changes
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
