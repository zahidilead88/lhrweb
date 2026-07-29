"use client";

import { useState, useRef } from "react";
import {
  Plus, Trash2, ChevronDown, ChevronRight, X, Pencil, Check,
  Palette, Type, Ruler, Layers,
} from "lucide-react";
import type { StyleClass, SiteTokens, Styles } from "@/types/builder";

// ── Shared primitives ─────────────────────────────────────────────────────────

function CSSInput({
  value, placeholder, onChange,
}: {
  value: string; placeholder?: string; onChange: (v: string) => void;
}) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder ?? "—"}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-2 py-1.5 text-[11px] font-mono border border-gray-100 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#6344d4]/15"
    />
  );
}

function ColorSwatch({
  value, onChange,
}: {
  value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 p-0.5 rounded-lg">
      <div className="relative w-7 h-7 rounded-md overflow-hidden border border-gray-200 flex-shrink-0">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 w-[150%] h-[150%] -translate-x-[15%] -translate-y-[15%] cursor-pointer border-0 p-0 outline-none"
        />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent text-[11px] font-mono focus:outline-none min-w-0"
        placeholder="#000000"
      />
    </div>
  );
}

function SectionHeader({
  title, icon: Icon, children,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-gray-50">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50/60 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon size={13} className="text-gray-400" />
          <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">{title}</span>
        </div>
        {open
          ? <ChevronDown size={11} className="text-gray-400" />
          : <ChevronRight size={11} className="text-gray-400" />}
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  );
}

// ── Inline name editor ─────────────────────────────────────────────────────────

function InlineName({
  value, onSave,
}: {
  value: string; onSave: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inp = useRef<HTMLInputElement>(null);

  if (editing) {
    return (
      <input
        ref={inp}
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => { onSave(draft); setEditing(false); }}
        onKeyDown={(e) => {
          if (e.key === "Enter") { onSave(draft); setEditing(false); }
          if (e.key === "Escape") setEditing(false);
        }}
        className="flex-1 min-w-0 px-1.5 py-0.5 text-[11px] font-mono border border-[#6344d4] rounded outline-none bg-white"
      />
    );
  }
  return (
    <button
      onClick={() => { setDraft(value); setEditing(true); }}
      className="flex-1 min-w-0 text-left text-[11px] font-mono font-bold text-gray-700 hover:text-[#6344d4] truncate"
    >
      {value}
    </button>
  );
}

// ── Tokens: Colors ────────────────────────────────────────────────────────────

function TokenColors({
  tokens, onChange,
}: {
  tokens: SiteTokens;
  onChange: (t: SiteTokens) => void;
}) {
  const upd = (colors: SiteTokens["colors"]) => onChange({ ...tokens, colors });

  return (
    <div className="px-4 space-y-1.5">
      {tokens.colors.map((c, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-24 flex-shrink-0">
            <input
              type="text"
              value={c.name}
              onChange={(e) => {
                const next = [...tokens.colors];
                next[i] = { ...next[i], name: e.target.value };
                upd(next);
              }}
              placeholder="name"
              className="w-full px-2 py-1 text-[10px] font-mono border border-gray-100 rounded-lg bg-white focus:outline-none"
            />
          </div>
          <div className="flex-1 min-w-0">
            <ColorSwatch
              value={c.value}
              onChange={(v) => {
                const next = [...tokens.colors];
                next[i] = { ...next[i], value: v };
                upd(next);
              }}
            />
          </div>
          <button
            onClick={() => upd(tokens.colors.filter((_, j) => j !== i))}
            className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
          >
            <X size={12} />
          </button>
        </div>
      ))}
      <button
        onClick={() => upd([...tokens.colors, { name: `color${tokens.colors.length + 1}`, value: "#6344d4" }])}
        className="flex items-center gap-1.5 text-[10px] font-bold text-[#6344d4] hover:text-purple-700 transition-colors mt-1"
      >
        <Plus size={10} /> Add Color
      </button>
    </div>
  );
}

// ── Tokens: Fonts ─────────────────────────────────────────────────────────────

function TokenFonts({
  tokens, onChange,
}: {
  tokens: SiteTokens;
  onChange: (t: SiteTokens) => void;
}) {
  const upd = (fonts: SiteTokens["fonts"]) => onChange({ ...tokens, fonts });

  return (
    <div className="px-4 space-y-1.5">
      {tokens.fonts.map((f, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <input
            type="text"
            value={f.name}
            onChange={(e) => {
              const next = [...tokens.fonts];
              next[i] = { ...next[i], name: e.target.value };
              upd(next);
            }}
            placeholder="name"
            className="w-20 flex-shrink-0 px-2 py-1.5 text-[10px] font-mono border border-gray-100 rounded-lg bg-white focus:outline-none"
          />
          <input
            type="text"
            value={f.family}
            onChange={(e) => {
              const next = [...tokens.fonts];
              next[i] = { ...next[i], family: e.target.value };
              upd(next);
            }}
            placeholder="Inter, sans-serif"
            className="flex-1 min-w-0 px-2 py-1.5 text-[10px] font-mono border border-gray-100 rounded-lg bg-white focus:outline-none"
          />
          <button
            onClick={() => upd(tokens.fonts.filter((_, j) => j !== i))}
            className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
          >
            <X size={12} />
          </button>
        </div>
      ))}
      <button
        onClick={() => upd([...tokens.fonts, { name: `font${tokens.fonts.length + 1}`, family: "Inter, sans-serif" }])}
        className="flex items-center gap-1.5 text-[10px] font-bold text-[#6344d4] hover:text-purple-700 transition-colors mt-1"
      >
        <Plus size={10} /> Add Font
      </button>
    </div>
  );
}

// ── Tokens: Spacing ───────────────────────────────────────────────────────────

function TokenSpacing({
  tokens, onChange,
}: {
  tokens: SiteTokens;
  onChange: (t: SiteTokens) => void;
}) {
  const entries = Object.entries(tokens.spacing);
  const upd = (spacing: SiteTokens["spacing"]) => onChange({ ...tokens, spacing });

  return (
    <div className="px-4 space-y-1.5">
      {entries.map(([k, v]) => (
        <div key={k} className="flex items-center gap-1.5">
          <input
            type="text"
            defaultValue={k}
            onBlur={(e) => {
              const newKey = e.target.value.trim();
              if (!newKey || newKey === k) return;
              const next = { ...tokens.spacing };
              delete next[k];
              next[newKey] = v;
              upd(next);
            }}
            className="w-16 flex-shrink-0 px-2 py-1.5 text-[10px] font-mono border border-gray-100 rounded-lg bg-white focus:outline-none"
          />
          <input
            type="text"
            value={v}
            onChange={(e) => upd({ ...tokens.spacing, [k]: e.target.value })}
            placeholder="16px"
            className="flex-1 min-w-0 px-2 py-1.5 text-[10px] font-mono border border-gray-100 rounded-lg bg-white focus:outline-none"
          />
          <button
            onClick={() => {
              const next = { ...tokens.spacing };
              delete next[k];
              upd(next);
            }}
            className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
          >
            <X size={12} />
          </button>
        </div>
      ))}
      <button
        onClick={() => upd({ ...tokens.spacing, [`space${entries.length + 1}`]: "16px" })}
        className="flex items-center gap-1.5 text-[10px] font-bold text-[#6344d4] hover:text-purple-700 transition-colors mt-1"
      >
        <Plus size={10} /> Add Spacing
      </button>
    </div>
  );
}

// ── Class style editor (inline, compact) ──────────────────────────────────────

const CLASS_PROPS: { key: keyof Styles; label: string; placeholder: string }[] = [
  { key: "color",           label: "Text Color",    placeholder: "#000000" },
  { key: "backgroundColor", label: "Background",    placeholder: "#ffffff" },
  { key: "fontSize",        label: "Font Size",     placeholder: "16px" },
  { key: "fontWeight",      label: "Font Weight",   placeholder: "400" },
  { key: "lineHeight",      label: "Line Height",   placeholder: "1.5" },
  { key: "padding",         label: "Padding",       placeholder: "16px" },
  { key: "borderRadius",    label: "Border Radius", placeholder: "8px" },
  { key: "display",         label: "Display",       placeholder: "block" },
  { key: "gap",             label: "Gap",           placeholder: "16px" },
  { key: "maxWidth",        label: "Max Width",     placeholder: "100%" },
];

function ClassEditor({
  cls, onChange,
}: {
  cls: StyleClass;
  onChange: (c: StyleClass) => void;
}) {
  const get = (prop: keyof Styles): string => {
    const val = cls.styles.desktop[prop];
    return val !== undefined ? String(val) : "";
  };
  const set = (prop: keyof Styles, val: string) => {
    onChange({
      ...cls,
      styles: {
        ...cls.styles,
        desktop: { ...cls.styles.desktop, [prop]: val || undefined },
      },
    });
  };

  return (
    <div className="mx-3 mb-2 bg-gray-50 rounded-xl p-3 space-y-2 border border-gray-100">
      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Desktop Styles</p>
      <div className="grid grid-cols-2 gap-1.5">
        {CLASS_PROPS.map(({ key, label, placeholder }) => (
          <div key={key}>
            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
            <CSSInput value={get(key)} placeholder={placeholder} onChange={(v) => set(key, v)} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Class list row ─────────────────────────────────────────────────────────────

function ClassRow({
  cls, onChange, onDelete,
}: {
  cls: StyleClass;
  onChange: (c: StyleClass) => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-2 px-4 py-2 group">
        <button
          onClick={() => setOpen(!open)}
          className="p-0.5 text-gray-400 hover:text-[#6344d4] transition-colors flex-shrink-0"
        >
          {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        </button>

        {/* Class name — inline editable */}
        <span className="text-[10px] text-gray-400 font-mono flex-shrink-0">.</span>
        <InlineName
          value={cls.name}
          onSave={(name) => onChange({ ...cls, name })}
        />

        {/* Property count badge */}
        <span className="text-[9px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
          {Object.values(cls.styles.desktop).filter(Boolean).length} props
        </span>

        <button
          onClick={onDelete}
          className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={11} />
        </button>
      </div>

      {open && (
        <ClassEditor cls={cls} onChange={onChange} />
      )}
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export interface StylesPanelProps {
  classes: StyleClass[];
  tokens: SiteTokens;
  onClassesChange: (classes: StyleClass[]) => void;
  onTokensChange: (tokens: SiteTokens) => void;
}

export default function StylesPanel({
  classes, tokens, onClassesChange, onTokensChange,
}: StylesPanelProps) {
  const createClass = () => {
    const name = `class-${classes.length + 1}`;
    onClassesChange([
      ...classes,
      {
        name,
        styles: { desktop: {} },
      },
    ]);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">

      {/* ── Design Tokens ── */}
      <SectionHeader title="Colors" icon={Palette}>
        <TokenColors tokens={tokens} onChange={onTokensChange} />
      </SectionHeader>

      <SectionHeader title="Fonts" icon={Type}>
        <TokenFonts tokens={tokens} onChange={onTokensChange} />
      </SectionHeader>

      <SectionHeader title="Spacing Scale" icon={Ruler}>
        <TokenSpacing tokens={tokens} onChange={onTokensChange} />
      </SectionHeader>

      {/* ── Named Classes ── */}
      <div className="border-b border-gray-50">
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Layers size={13} className="text-gray-400" />
            <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
              Classes
            </span>
            {classes.length > 0 && (
              <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-bold">
                {classes.length}
              </span>
            )}
          </div>
          <button
            onClick={createClass}
            className="flex items-center gap-1 text-[10px] font-bold text-[#6344d4] hover:text-purple-700 transition-colors"
          >
            <Plus size={11} /> New
          </button>
        </div>

        {classes.length === 0 ? (
          <div className="px-4 pb-4 text-center">
            <p className="text-[11px] text-gray-400">No classes yet</p>
            <p className="text-[10px] text-gray-300 mt-0.5">
              Create reusable styles to apply across elements
            </p>
          </div>
        ) : (
          <div>
            {classes.map((cls, i) => (
              <ClassRow
                key={i}
                cls={cls}
                onChange={(updated) => {
                  const next = [...classes];
                  next[i] = updated;
                  onClassesChange(next);
                }}
                onDelete={() => onClassesChange(classes.filter((_, j) => j !== i))}
              />
            ))}
          </div>
        )}
      </div>

      {/* Usage hint */}
      <div className="px-4 py-3 text-[10px] text-gray-400 leading-relaxed">
        <strong className="text-gray-500">How to use:</strong> Select an element, open the properties panel, and assign a class from the Class dropdown. Token variables are available as <span className="font-mono">var(--color-name)</span> in any CSS input.
      </div>
    </div>
  );
}
