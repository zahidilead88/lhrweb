"use client";

// Round 5 — AI SEO panel (Ch 5.2) and Theme preview modal (Ch 8.1: preview → Apply/Discard).

import { useState } from "react";
import { X, Sparkles, Search, Palette } from "lucide-react";

export interface PageSeo {
  title?: string;
  description?: string;
  keywords?: string[];
}

export interface AiTheme {
  primaryColor?: string;
  tokens?: {
    colors?: { name: string; value: string }[];
    fonts?: { name: string; family: string }[];
  };
}

const inputCls = "w-full px-3 py-2 text-[12px] text-gray-800 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6344d4]/10 focus:border-[#6344d4]/40 transition-all";
const lblCls   = "block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5";

function ModalShell({ title, icon, onClose, children }: {
  title: string; icon: React.ReactNode; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[440px] max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 bg-[#6344d4]/10 text-[#6344d4] rounded-lg flex items-center justify-center">{icon}</span>
            <p className="text-[14px] font-bold text-gray-900">{title}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all">
            <X size={16} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ── SEO modal ──────────────────────────────────────────────────────────────────

export function SeoModal({ pageName, initial, onGenerate, onSave, onClose }: {
  pageName: string;
  initial: PageSeo;
  onGenerate: () => Promise<PageSeo>;
  onSave: (seo: PageSeo) => Promise<void>;
  onClose: () => void;
}) {
  const [seo, setSeo] = useState<PageSeo>(initial);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const titleLen = (seo.title || "").length;
  const descLen  = (seo.description || "").length;

  return (
    <ModalShell title={`SEO — ${pageName}`} icon={<Search size={14} />} onClose={onClose}>
      <div className="space-y-4">
        <button
          onClick={async () => {
            setGenerating(true);
            try { setSeo(await onGenerate()); } catch { /* toast shown by caller */ }
            finally { setGenerating(false); }
          }}
          disabled={generating}
          className="w-full py-2.5 flex items-center justify-center gap-2 text-[12px] font-bold text-[#6344d4] bg-[#6344d4]/[0.06] border border-[#6344d4]/20 rounded-xl hover:bg-[#6344d4]/10 disabled:opacity-50 transition-all"
        >
          <Sparkles size={13} /> {generating ? "Writing metadata…" : "Generate with AI"}
        </button>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Page title</label>
            <span className={`text-[10px] font-mono ${titleLen > 60 ? "text-red-500" : "text-gray-400"}`}>{titleLen}/60</span>
          </div>
          <input className={inputCls} value={seo.title || ""} maxLength={80}
            onChange={(e) => setSeo({ ...seo, title: e.target.value })} placeholder="Shown in search results and browser tabs" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Meta description</label>
            <span className={`text-[10px] font-mono ${descLen > 160 ? "text-red-500" : "text-gray-400"}`}>{descLen}/160</span>
          </div>
          <textarea className={`${inputCls} resize-none min-h-[72px]`} value={seo.description || ""} maxLength={220}
            onChange={(e) => setSeo({ ...seo, description: e.target.value })} placeholder="One clear sentence about what this page offers" />
        </div>

        <div>
          <label className={lblCls}>Keywords (comma-separated)</label>
          <input className={inputCls} value={(seo.keywords || []).join(", ")}
            onChange={(e) => setSeo({ ...seo, keywords: e.target.value.split(",").map((k) => k.trim()).filter(Boolean) })}
            placeholder="web design lahore, custom websites" />
        </div>

        <button
          onClick={async () => {
            setSaving(true);
            try { await onSave(seo); onClose(); } catch { /* toast by caller */ }
            finally { setSaving(false); }
          }}
          disabled={saving}
          className="w-full py-2.5 text-[12px] font-bold text-white bg-gray-900 rounded-xl hover:bg-black disabled:opacity-50 transition-all"
        >
          {saving ? "Saving…" : "Save SEO"}
        </button>
      </div>
    </ModalShell>
  );
}

// ── Theme modal (Ch 8.1 — preview candidate, nothing persists until Apply) ─────

export function ThemeModal({ onGenerate, onApply, onClose }: {
  onGenerate: (prompt: string) => Promise<AiTheme>;
  onApply: (theme: AiTheme) => Promise<void>;
  onClose: () => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [candidate, setCandidate] = useState<AiTheme | null>(null);
  const [generating, setGenerating] = useState(false);
  const [applying, setApplying] = useState(false);

  const generate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    try { setCandidate(await onGenerate(prompt)); } catch { /* toast by caller */ }
    finally { setGenerating(false); }
  };

  return (
    <ModalShell title="AI Theme" icon={<Palette size={14} />} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className={lblCls}>Describe the look you want</label>
          <div className="flex gap-2">
            <input className={inputCls} value={prompt} maxLength={1000}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") generate(); }}
              placeholder="e.g. warm and earthy, like a specialty coffee brand" />
            <button onClick={generate} disabled={generating || !prompt.trim()}
              className="px-3 rounded-lg bg-[#6344d4] text-white disabled:opacity-40 transition-all flex-shrink-0" title="Generate">
              <Sparkles size={14} />
            </button>
          </div>
        </div>

        {generating && <p className="text-[12px] text-gray-400 animate-pulse py-2">Designing a palette…</p>}

        {candidate && !generating && (
          <div className="border border-gray-100 rounded-xl p-4 space-y-3 bg-gray-50/50">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Preview — nothing is applied yet</p>
            <div className="flex flex-wrap gap-2">
              {(candidate.tokens?.colors || []).map((c) => (
                <div key={c.name} className="flex flex-col items-center gap-1">
                  <span className="w-10 h-10 rounded-lg border border-black/5 shadow-sm" style={{ background: c.value }} title={c.value} />
                  <span className="text-[9px] text-gray-400 font-medium">{c.name}</span>
                </div>
              ))}
            </div>
            {(candidate.tokens?.fonts || []).length > 0 && (
              <div className="text-[12px] text-gray-600 space-y-0.5">
                {candidate.tokens!.fonts!.map((f) => (
                  <p key={f.name}><span className="text-gray-400 text-[10px] uppercase font-bold mr-2">{f.name}</span>{f.family}</p>
                ))}
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button
                onClick={async () => {
                  setApplying(true);
                  try { await onApply(candidate); onClose(); } catch { /* toast by caller */ }
                  finally { setApplying(false); }
                }}
                disabled={applying}
                className="flex-1 py-2.5 text-[12px] font-bold text-white bg-gray-900 rounded-xl hover:bg-black disabled:opacity-50 transition-all"
              >
                {applying ? "Applying…" : "Apply theme"}
              </button>
              <button onClick={() => setCandidate(null)}
                className="px-4 py-2.5 text-[12px] font-bold text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
                Discard
              </button>
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
