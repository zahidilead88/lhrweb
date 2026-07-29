"use client";

import { useState } from "react";
import {
  X, Search, Box, Rows3, Grid3x3, Columns2, Heading, Pilcrow, Link2, List,
  Image as ImageIcon, Video, Shapes, Triangle, RectangleEllipsis,
  ClipboardList, TextCursorInput, ChevronDown, Plus,
} from "lucide-react";
import type { ElementNode } from "@/types/builder";

function uid() { return `el-${crypto.randomUUID().slice(0, 8)}`; }

// ── Default element factory ───────────────────────────────────────────────────

function createElement(type: string): ElementNode {
  const id = uid();
  const base = { id, attrs: {} as Record<string, string>, children: [] as ElementNode[] };

  switch (type) {
    case "div": return {
      ...base, tag: "div",
      styles: { desktop: { padding: "24px", minHeight: "80px", backgroundColor: "#f9fafb", border: "1px dashed #e5e7eb", borderRadius: "8px" } },
    };
    case "section": return {
      ...base, tag: "section",
      styles: { desktop: { padding: "80px 40px", width: "100%", minHeight: "200px" } },
    };
    case "grid": return {
      ...base, tag: "div",
      styles: { desktop: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px", padding: "40px" } },
      children: [1, 2, 3].map(() => ({
        id: uid(), tag: "div" as const, attrs: {}, content: "Column",
        styles: { desktop: { padding: "24px", backgroundColor: "#f9fafb", borderRadius: "8px", textAlign: "center" as const, fontSize: "14px", color: "#6b7280" } },
        children: [],
      })),
    };
    case "flex": return {
      ...base, tag: "div",
      styles: { desktop: { display: "flex", flexDirection: "row", gap: "16px", padding: "24px", alignItems: "center" } },
    };
    case "heading": return {
      ...base, tag: "h2", content: "Your Heading Here",
      styles: { desktop: { fontSize: "36px", fontWeight: "700", color: "#111827", lineHeight: "1.2", marginBottom: "16px" } },
    };
    case "paragraph": return {
      ...base, tag: "p", content: "Write your paragraph text here. Click to edit and customise.",
      styles: { desktop: { fontSize: "16px", color: "#4b5563", lineHeight: "1.6", marginBottom: "16px" } },
    };
    case "link": return {
      ...base, tag: "a", content: "Click here", attrs: { href: "#" },
      styles: { desktop: { fontSize: "16px", color: "#6344d4", textDecoration: "underline", cursor: "pointer" } },
    };
    case "list": return {
      ...base, tag: "ul",
      styles: { desktop: { fontSize: "16px", color: "#4b5563", lineHeight: "1.8", paddingLeft: "24px" } },
      children: ["List item 1", "List item 2", "List item 3"].map((text) => ({
        id: uid(), tag: "li" as const, content: text, attrs: {},
        styles: { desktop: {} }, children: [],
      })),
    };
    case "image": return {
      ...base, tag: "img",
      attrs: { src: "https://placehold.co/800x400/f3f4f6/9ca3af?text=Image", alt: "Image" },
      styles: { desktop: { width: "100%", height: "auto", borderRadius: "8px", display: "block" } },
    };
    case "video": return {
      ...base, tag: "video",
      attrs: { src: "", controls: "true", poster: "" },
      styles: { desktop: { width: "100%", height: "400px", borderRadius: "8px", display: "block", backgroundColor: "#111827" } },
    };
    case "icon": return {
      ...base, tag: "span", content: "★",
      styles: { desktop: { fontSize: "40px", color: "#6344d4", display: "inline-block", lineHeight: "1" } },
    };
    case "svg": return {
      ...base, tag: "svg",
      attrs: { width: "80", height: "80", viewBox: "0 0 80 80", fill: "none", xmlns: "http://www.w3.org/2000/svg" },
      content: "<circle cx=\"40\" cy=\"40\" r=\"40\" fill=\"#6344d4\" fill-opacity=\"0.1\"/><circle cx=\"40\" cy=\"40\" r=\"24\" fill=\"#6344d4\" fill-opacity=\"0.4\"/>",
      styles: { desktop: { display: "block" } },
    };
    case "button": return {
      ...base, tag: "button", content: "Click Me",
      styles: { desktop: {
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "12px 28px", backgroundColor: "#6344d4", color: "#ffffff",
        borderRadius: "8px", fontSize: "15px", fontWeight: "600", border: "none", cursor: "pointer",
      } },
    };
    case "form": return {
      ...base, tag: "form",
      styles: { desktop: { display: "flex", flexDirection: "column", gap: "16px", maxWidth: "480px", padding: "32px", backgroundColor: "#f9fafb", borderRadius: "12px" } },
      children: [
        {
          id: uid(), tag: "input" as const, attrs: { type: "text", placeholder: "Your name" },
          styles: { desktop: { padding: "12px 16px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", width: "100%", outline: "none" } },
          children: [],
        },
        {
          id: uid(), tag: "input" as const, attrs: { type: "email", placeholder: "Email address" },
          styles: { desktop: { padding: "12px 16px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", width: "100%", outline: "none" } },
          children: [],
        },
        {
          id: uid(), tag: "button" as const, content: "Submit", attrs: { type: "submit" },
          styles: { desktop: { padding: "12px 24px", backgroundColor: "#6344d4", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer" } },
          children: [],
        },
      ],
    };
    case "input": return {
      ...base, tag: "input",
      attrs: { type: "text", placeholder: "Enter text..." },
      styles: { desktop: { padding: "12px 16px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", width: "100%", outline: "none" } },
    };
    case "select": return {
      ...base, tag: "select",
      attrs: {},
      styles: { desktop: { padding: "12px 16px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", width: "100%", backgroundColor: "#fff" } },
    };
    default: return {
      ...base, tag: "div",
      styles: { desktop: { padding: "24px" } },
    };
  }
}

// ── Category & item definitions ───────────────────────────────────────────────

const ELEMENT_CATEGORIES = [
  {
    label: "LAYOUT",
    items: [
      { id: "div",     label: "Div",      Icon: Box },
      { id: "section", label: "Section",  Icon: Rows3 },
      { id: "grid",    label: "Grid",     Icon: Grid3x3 },
      { id: "flex",    label: "Flex row", Icon: Columns2 },
    ],
  },
  {
    label: "TYPOGRAPHY",
    items: [
      { id: "heading",   label: "Heading",   Icon: Heading },
      { id: "paragraph", label: "Paragraph", Icon: Pilcrow },
      { id: "link",      label: "Link",      Icon: Link2 },
      { id: "list",      label: "List",      Icon: List },
    ],
  },
  {
    label: "MEDIA",
    items: [
      { id: "image", label: "Image", Icon: ImageIcon },
      { id: "video", label: "Video", Icon: Video },
      { id: "icon",  label: "Icon",  Icon: Shapes },
      { id: "svg",   label: "SVG",   Icon: Triangle },
    ],
  },
  {
    label: "INTERACTIVE",
    items: [
      { id: "button", label: "Button", Icon: RectangleEllipsis },
      { id: "form",   label: "Form",   Icon: ClipboardList },
      { id: "input",  label: "Input",  Icon: TextCursorInput },
      { id: "select", label: "Select", Icon: ChevronDown },
    ],
  },
];

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  onAdd:   (element: ElementNode) => void;
  onClose: () => void;
}

export default function ElementPicker({ onAdd, onClose }: Props) {
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? ELEMENT_CATEGORIES
        .map((cat) => ({
          ...cat,
          items: cat.items.filter((item) =>
            item.label.toLowerCase().includes(search.toLowerCase())
          ),
        }))
        .filter((cat) => cat.items.length > 0)
    : ELEMENT_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      {/* Drawer */}
      <div className="w-[300px] bg-white flex flex-col h-full shadow-2xl border-l border-gray-100">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#6344d4] rounded-xl flex items-center justify-center shadow-md shadow-purple-500/20">
              <Plus className="text-white" size={15} />
            </div>
            <div>
              <h2 className="text-[14px] font-bold text-gray-900 leading-tight">Add Element</h2>
              <p className="text-[10px] text-gray-400">Click to insert onto page</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all"
          >
            <X size={15} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pt-3 pb-1 flex-shrink-0">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
            <Search size={13} className="text-gray-400 flex-shrink-0" />
            <input
              autoFocus
              type="text"
              placeholder="Search elements..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-[12px] text-gray-800 placeholder-gray-400 outline-none border-none"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-gray-300 hover:text-gray-500 transition-colors">
                <X size={11} />
              </button>
            )}
          </div>
        </div>

        {/* Element grid */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <Search className="text-gray-300" size={22} />
              <p className="text-[13px] font-semibold text-gray-500">No elements match</p>
              <p className="text-[11px] text-gray-400">Try a different search term</p>
            </div>
          ) : (
            filtered.map((cat) => (
              <div key={cat.label}>
                {/* Category label */}
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 px-0.5">
                  {cat.label}
                </p>

                {/* 2-col grid */}
                <div className="grid grid-cols-2 gap-2">
                  {cat.items.map(({ id, label, Icon }) => (
                    <button
                      key={id}
                      onClick={() => { onAdd(createElement(id)); onClose(); }}
                      className="flex flex-col items-center justify-center gap-2.5 py-4 bg-gray-50/70 border border-gray-100 rounded-2xl hover:bg-purple-50/60 hover:border-[#6344d4]/25 active:scale-[0.97] transition-all group"
                    >
                      <Icon
                        size={20}
                        className="text-gray-500 group-hover:text-[#6344d4] transition-colors"
                      />
                      <span className="text-[11px] font-semibold text-gray-600 group-hover:text-[#6344d4] transition-colors leading-tight">
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
