"use client";

import React, { useState, useMemo } from "react";
import { X, Zap, ChevronDown, ChevronRight, Check, Loader2 } from "lucide-react";
import type { Frame, SavedSection, StyleClass, SiteTokens } from "@/types/builder";
import { generateHTML } from "@/lib/generateHTML";
import { generateCSS  } from "@/lib/generateCSS";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Theme ─────────────────────────────────────────────────────────────────────

const BG      = "#0f1729";
const SURFACE = "rgba(255,255,255,0.06)";
const BORDER  = "rgba(255,255,255,0.09)";
const BRAND   = "#7B6EF5";
const T       = "rgba(255,255,255,0.75)";
const M       = "rgba(255,255,255,0.35)";

// ── Collapsible code block ─────────────────────────────────────────────────────

function CodeBlock({ title, code, lang }: { title: string; code: string; lang: string }) {
  const [open, setOpen] = useState(false);
  const lines = code.split("\n").length;
  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, overflow: "hidden", marginBottom: 8 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "8px 12px", background: SURFACE, border: "none", cursor: "pointer",
          color: T, fontSize: 11, fontWeight: 600,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 9, fontFamily: "ui-monospace,monospace", background: "rgba(123,110,245,0.2)", color: BRAND, padding: "1px 5px", borderRadius: 3 }}>{lang}</span>
          {title}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 10, color: M }}>{lines} line{lines !== 1 ? "s" : ""}</span>
          {open ? <ChevronDown size={12} color={M} /> : <ChevronRight size={12} color={M} />}
        </span>
      </button>
      {open && (
        <pre style={{
          margin: 0, padding: "10px 12px",
          background: "#080e1a", color: "#a8d5ff",
          fontSize: 10, fontFamily: "ui-monospace, Menlo, monospace",
          lineHeight: 1.6, overflowX: "auto", maxHeight: 260,
          overflowY: "auto", whiteSpace: "pre",
        }}>
          {code || "(empty)"}
        </pre>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export interface ConvertModalProps {
  frame: Frame;
  classes?: StyleClass[];
  tokens?: SiteTokens;
  projectId: string;
  token: string;
  onSaved: (section: SavedSection) => void;
  onClose: () => void;
}

type Status = "idle" | "saving" | "done" | "error";

export default function ConvertModal({
  frame, classes = [], tokens,
  projectId, token, onSaved, onClose,
}: ConvertModalProps) {
  const [sectionName, setSectionName] = useState(frame.name);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg]  = useState("");

  // Generate HTML + CSS from frame children
  const html = useMemo(() => generateHTML(frame.children), [frame.children]);
  const css  = useMemo(() => generateCSS(frame.children, classes, tokens), [frame.children, classes, tokens]);

  const handleSave = async () => {
    if (status === "saving" || status === "done") return;
    const name = sectionName.trim() || frame.name;
    setStatus("saving");
    setErrorMsg("");

    const section: SavedSection = {
      id:            `sec_${frame.id}_${Date.now()}`,
      name,
      html,
      css,
      sourceFrameId: frame.id,
      frameWidth:    frame.width,
      frameHeight:   frame.height,
      createdAt:     new Date().toISOString(),
    };

    try {
      const res = await fetch(`${API}/api/builder/project/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ projectId, section }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Save failed");
      setStatus("done");
      onSaved(section);
      setTimeout(onClose, 1200);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Save failed");
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9000,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: 520, maxHeight: "85vh",
        background: BG, borderRadius: 16,
        border: `1px solid ${BORDER}`,
        boxShadow: "0 40px 100px rgba(0,0,0,0.6)",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(123,110,245,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={14} color={BRAND} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T }}>Convert Frame to Section</div>
              <div style={{ fontSize: 10, color: M, marginTop: 1 }}>
                {frame.name} · {frame.width}×{frame.height} · {frame.children.length} element{frame.children.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: SURFACE, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: M }}>
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>

          {/* Section name */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: M, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
              Section Name
            </label>
            <input
              value={sectionName}
              onChange={e => setSectionName(e.target.value)}
              placeholder={frame.name}
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "8px 12px", borderRadius: 8,
                border: `1px solid ${BORDER}`, background: SURFACE,
                color: T, fontSize: 13, fontWeight: 600, outline: "none",
              }}
              onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = BRAND; }}
              onBlur={e  => { (e.currentTarget as HTMLElement).style.borderColor = BORDER; }}
            />
          </div>

          {/* Preview stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
            {[
              { label: "Elements",  value: String(frame.children.length) },
              { label: "HTML size", value: `${(html.length / 1024).toFixed(1)} KB` },
              { label: "CSS size",  value: `${(css.length  / 1024).toFixed(1)} KB` },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: SURFACE, borderRadius: 8, padding: "8px 10px", border: `1px solid ${BORDER}` }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.2)", letterSpacing: "0.09em", textTransform: "uppercase" }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T, marginTop: 2 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Code previews */}
          <div style={{ fontSize: 10, fontWeight: 700, color: M, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
            Output Preview
          </div>
          <CodeBlock title="HTML" code={html} lang="html" />
          <CodeBlock title="CSS"  code={css}  lang="css"  />

        </div>

        {/* Footer */}
        <div style={{ flexShrink: 0, padding: "12px 16px", borderTop: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 8 }}>
          {errorMsg && (
            <span style={{ flex: 1, fontSize: 11, color: "#f87171" }}>{errorMsg}</span>
          )}
          <div style={{ flex: 1 }} />
          <button
            onClick={onClose}
            style={{ padding: "7px 16px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "transparent", color: M, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={status === "saving" || status === "done"}
            style={{
              padding: "7px 20px", borderRadius: 8, border: "none", cursor: status === "saving" || status === "done" ? "default" : "pointer",
              background: status === "done" ? "#059669" : BRAND,
              color: "#fff", fontSize: 12, fontWeight: 700,
              display: "flex", alignItems: "center", gap: 6,
              opacity: status === "saving" ? 0.8 : 1,
              transition: "background 0.2s",
            }}
          >
            {status === "saving" && <Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} />}
            {status === "done"   && <Check   size={13} />}
            {status === "done" ? "Saved!" : status === "saving" ? "Saving…" : "Save to Designs"}
          </button>
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
