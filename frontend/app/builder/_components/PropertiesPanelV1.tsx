"use client";

import { useState, useEffect, useRef } from "react";
import {
  X, Palette, AlignLeft, AlignCenter, AlignRight,
  ChevronDown, ChevronRight, Sliders, Type, Sparkles, LayoutGrid, RotateCcw,
  ImageIcon, Upload, Layers, Shield,
} from "lucide-react";
import type { BlockStyles } from "@/lib/builderComponents";

const CARD_BLOCK_TYPES = ["services", "features", "whyus", "testimonials", "team", "pricing", "faq"];
const GRID_BLOCK_TYPES = ["services", "features", "whyus", "testimonials", "team", "pricing", "gallery"];

interface Block {
  id: string;
  type: string;
  content: Record<string, unknown>;
  styles?: BlockStyles;
}

interface Props {
  block: Block;
  onStyleChange: (styles: BlockStyles) => void;
  onClose: () => void;
  initialSection?: string;
}

// ── Color Presets ─────────────────────────────────────────────────────────────
const PRESET_COLORS = [
  { label: "White", value: "#ffffff" },
  { label: "Slate", value: "#0f172a" },
  { label: "Indigo", value: "#6344d4" },
  { label: "Emerald", value: "#059669" },
  { label: "Crimson", value: "#dc2626" },
  { label: "Violet", value: "#7c3aed" },
  { label: "Amber", value: "#d97706" },
  { label: "Rose", value: "#db2777" },
];

// ── Reusable Premium Controls ──────────────────────────────────────────────────

function PremiumSegmentedControl({
  options,
  value,
  onChange,
}: {
  options: { label: React.ReactNode; value: string }[];
  value: string | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex bg-gray-50/70 border border-gray-100 rounded-xl p-1 gap-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 py-2 px-3 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
            value === opt.value 
              ? "bg-white text-black shadow-sm border border-gray-100" 
              : "text-gray-400 hover:text-gray-600 hover:bg-white/50"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function PremiumColorRow({
  value,
  placeholder,
  onChange,
}: {
  value: string | undefined;
  placeholder: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2.5">
      {/* Visual Presets Grid */}
      <div className="flex flex-wrap gap-1.5">
        {PRESET_COLORS.map((preset) => (
          <button
            key={preset.value}
            onClick={() => onChange(preset.value)}
            title={preset.label}
            className={`w-6 h-6 rounded-full border transition-all hover:scale-110 flex items-center justify-center ${
              value?.toLowerCase() === preset.value.toLowerCase() 
                ? "border-black ring-2 ring-black/10 scale-105" 
                : "border-gray-200"
            }`}
            style={{ backgroundColor: preset.value }}
          >
            {value?.toLowerCase() === preset.value.toLowerCase() && (
              <span className="w-1.5 h-1.5 rounded-full bg-current invert opacity-60" />
            )}
          </button>
        ))}
      </div>

      {/* Manual Input */}
      <div className="flex items-center gap-2 bg-gray-50/70 border border-gray-100 p-1 rounded-xl">
        <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 flex items-center justify-center">
          <input
            type="color"
            value={value ?? "#ffffff"}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-[150%] h-[150%] -translate-x-[15%] -translate-y-[15%] cursor-pointer p-0 border-0 outline-none"
          />
        </div>
        <input
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent px-2.5 py-1 text-[11px] font-mono border-none focus:outline-none focus:ring-0 text-gray-800"
        />
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold text-gray-600 mb-2 uppercase tracking-wide">{children}</p>
  );
}

// ── Accordion Component ────────────────────────────────────────────────────────

function StyleAccordion({
  title,
  icon: Icon,
  isOpen,
  onToggle,
  children
}: {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-100 rounded-2xl bg-white overflow-hidden shadow-sm transition-all hover:border-gray-200/80">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 bg-gray-50/50 hover:bg-gray-50/80 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="text-gray-400" size={16} />
          <span className="text-[13px] font-bold text-gray-800 tracking-tight">{title}</span>
        </div>
        {isOpen ? <ChevronDown size={15} className="text-gray-400" /> : <ChevronRight size={15} className="text-gray-400" />}
      </button>

      {isOpen && (
        <div className="p-5 space-y-5 border-t border-gray-50 animate-in fade-in slide-in-from-top-1 duration-150">
          {children}
        </div>
      )}
    </div>
  );
}

// ── BG Image Upload ────────────────────────────────────────────────────────────

function BgImageUpload({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange(ev.target?.result as string);
    reader.readAsDataURL(file);
  };
  return (
    <div className="space-y-2">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-100 aspect-video bg-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="w-full h-full object-cover" />
          <button onClick={() => onChange("")}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-red-500 transition-colors">
            <X size={11} />
          </button>
        </div>
      ) : (
        <button onClick={() => fileRef.current?.click()}
          className="w-full h-20 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:border-[#6344d4]/40 hover:text-[#6344d4]/70 transition-all">
          <Upload size={16} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Upload Image</span>
        </button>
      )}
      <div className="flex items-center gap-2 bg-gray-50/70 border border-gray-100 p-1 rounded-xl">
        <ImageIcon size={14} className="text-gray-300 flex-shrink-0 ml-1" />
        <input type="text" value={value?.startsWith("data:") ? "" : (value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Or paste image URL..."
          className="flex-1 bg-transparent px-1 py-1 text-[11px] font-mono border-none focus:outline-none focus:ring-0 text-gray-800" />
      </div>
    </div>
  );
}

// ── Toggle Row ─────────────────────────────────────────────────────────────────

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[11px] font-bold text-gray-600">{label}</span>
      <button onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-all ${checked ? "bg-black" : "bg-gray-200"}`}>
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${checked ? "left-4" : "left-0.5"}`} />
      </button>
    </div>
  );
}

// ── Main Properties Panel ──────────────────────────────────────────────────────

export default function PropertiesPanel({ block, onStyleChange, onClose, initialSection = "layout" }: Props) {
  const styles = block.styles ?? {};

  // Accordion Expand/Collapse States
  const [openSection, setOpenSection] = useState<string | null>(initialSection);

  // Auto-expand the accordion when the user clicks a specific element type in the preview canvas
  useEffect(() => {
    if (initialSection) {
      setOpenSection(initialSection);
    }
  }, [initialSection]);

  const toggleSection = (sect: string) => {
    setOpenSection(openSection === sect ? null : sect);
  };

  const update = (patch: Partial<BlockStyles>) => {
    onStyleChange({ ...styles, ...patch });
  };

  const hasCards = CARD_BLOCK_TYPES.includes(block.type);
  const hasGrid  = GRID_BLOCK_TYPES.includes(block.type);

  return (
    <aside className="w-[330px] bg-white flex flex-col h-full border-l border-gray-100 animate-in slide-in-from-right duration-250 flex-shrink-0 relative z-50">
        
        {/* Panel Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-gray-100 flex-shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black rounded-xl flex items-center justify-center shadow-lg shadow-black/10">
              <Palette size={16} className="text-white" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-gray-900 leading-tight">Visual Inspector</p>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">{block.type} Block</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-50 border border-transparent hover:border-gray-100 text-gray-400 hover:text-gray-900 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Accordion Inspector */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">

          {/* 1. Layout & Canvas Accordion */}
          <StyleAccordion
            title="Layout & Canvas"
            icon={Sliders}
            isOpen={openSection === "layout"}
            onToggle={() => toggleSection("layout")}
          >
            <div>
              <FieldLabel>Vertical Padding</FieldLabel>
              <PremiumSegmentedControl
                options={[
                  { label: "XS", value: "xs" },
                  { label: "S", value: "sm" },
                  { label: "M", value: "md" },
                  { label: "L", value: "lg" },
                  { label: "XL", value: "xl" },
                ]}
                value={styles.paddingY}
                onChange={(v) => update({ paddingY: v as BlockStyles["paddingY"] })}
              />
            </div>

            <div>
              <FieldLabel>Max Container Width</FieldLabel>
              <PremiumSegmentedControl
                options={[
                  { label: "SM", value: "sm" },
                  { label: "MD", value: "md" },
                  { label: "LG", value: "lg" },
                  { label: "XL", value: "xl" },
                  { label: "Full", value: "full" },
                ]}
                value={styles.maxWidth}
                onChange={(v) => update({ maxWidth: v as BlockStyles["maxWidth"] })}
              />
            </div>

            {hasGrid && (
              <div>
                <FieldLabel>Grid Columns</FieldLabel>
                <PremiumSegmentedControl
                  options={[
                    { label: "2 Col", value: "2" },
                    { label: "3 Col", value: "3" },
                    { label: "4 Col", value: "4" },
                  ]}
                  value={styles.gridCols}
                  onChange={(v) => update({ gridCols: v as BlockStyles["gridCols"] })}
                />
              </div>
            )}
          </StyleAccordion>

          {/* 2. Typography & Alignment Accordion */}
          <StyleAccordion
            title="Typography & Font Colors"
            icon={Type}
            isOpen={openSection === "typography"}
            onToggle={() => toggleSection("typography")}
          >
            <div>
              <FieldLabel>Heading Text Color</FieldLabel>
              <PremiumColorRow
                value={styles.headingColor}
                placeholder="#111111"
                onChange={(v) => update({ headingColor: v })}
              />
            </div>

            <div>
              <FieldLabel>Heading Text Size</FieldLabel>
              <PremiumSegmentedControl
                options={[
                  { label: "S", value: "sm" },
                  { label: "M", value: "md" },
                  { label: "L", value: "lg" },
                  { label: "XL", value: "xl" },
                ]}
                value={styles.headingSize}
                onChange={(v) => update({ headingSize: v as BlockStyles["headingSize"] })}
              />
            </div>

            <div>
              <FieldLabel>Body Text Color</FieldLabel>
              <PremiumColorRow
                value={styles.bodyColor}
                placeholder="#6b7280"
                onChange={(v) => update({ bodyColor: v })}
              />
            </div>

            <div>
              <FieldLabel>Headline Alignment</FieldLabel>
              <PremiumSegmentedControl
                options={[
                  { label: <AlignLeft size={13} />, value: "left" },
                  { label: <AlignCenter size={13} />, value: "center" },
                  { label: <AlignRight size={13} />, value: "right" },
                ]}
                value={styles.textAlign}
                onChange={(v) => update({ textAlign: v as BlockStyles["textAlign"] })}
              />
            </div>

            <div>
              <FieldLabel>Font Family</FieldLabel>
              <PremiumSegmentedControl
                options={[
                  { label: "Sans", value: "sans" },
                  { label: "Serif", value: "serif" },
                  { label: "Mono", value: "mono" },
                ]}
                value={styles.fontFamily}
                onChange={(v) => update({ fontFamily: v as BlockStyles["fontFamily"] })}
              />
            </div>
          </StyleAccordion>

          {/* 3. Accents & Call to Actions Accordion */}
          <StyleAccordion
            title="Accents & Buttons"
            icon={Sparkles}
            isOpen={openSection === "accents"}
            onToggle={() => toggleSection("accents")}
          >
            <div>
              <FieldLabel>Accent Palette Color</FieldLabel>
              <PremiumColorRow
                value={styles.accentColor}
                placeholder="#000000"
                onChange={(v) => update({ accentColor: v })}
              />
            </div>

            <div>
              <FieldLabel>Button Style Variant</FieldLabel>
              <PremiumSegmentedControl
                options={[
                  { label: "Solid", value: "filled" },
                  { label: "Outline", value: "outline" },
                  { label: "Ghost", value: "ghost" },
                ]}
                value={styles.buttonVariant}
                onChange={(v) => update({ buttonVariant: v as BlockStyles["buttonVariant"] })}
              />
            </div>

            <div>
              <FieldLabel>Button Border Radius</FieldLabel>
              <PremiumSegmentedControl
                options={[
                  { label: "Sharp", value: "md" },
                  { label: "Sleek", value: "lg" },
                  { label: "Pill", value: "full" },
                ]}
                value={styles.buttonRadius}
                onChange={(v) => update({ buttonRadius: v as BlockStyles["buttonRadius"] })}
              />
            </div>
          </StyleAccordion>

          {/* 4. Background & Image */}
          <StyleAccordion
            title="Background & Image"
            icon={ImageIcon}
            isOpen={openSection === "background"}
            onToggle={() => toggleSection("background")}
          >
            {/* Section bg color — always visible */}
            <div>
              <FieldLabel>Section Background Color</FieldLabel>
              <PremiumColorRow
                value={styles.sectionBg}
                placeholder="#ffffff"
                onChange={(v) => update({ sectionBg: v })}
              />
            </div>

            <div>
              <FieldLabel>Background Enhancement</FieldLabel>
              <PremiumSegmentedControl
                options={[
                  { label: "None", value: "color" },
                  { label: "Gradient", value: "gradient" },
                  { label: "Image", value: "image" },
                ]}
                value={styles.bgType ?? "color"}
                onChange={(v) => update({ bgType: v as BlockStyles["bgType"] })}
              />
            </div>

            {/* Gradient */}
            {styles.bgType === "gradient" && (
              <>
                <div>
                  <FieldLabel>Gradient From</FieldLabel>
                  <PremiumColorRow
                    value={styles.bgGradientFrom}
                    placeholder="#6344d4"
                    onChange={(v) => update({ bgGradientFrom: v })}
                  />
                </div>
                <div>
                  <FieldLabel>Gradient To</FieldLabel>
                  <PremiumColorRow
                    value={styles.bgGradientTo}
                    placeholder="#000000"
                    onChange={(v) => update({ bgGradientTo: v })}
                  />
                </div>
                <div>
                  <FieldLabel>Direction</FieldLabel>
                  <PremiumSegmentedControl
                    options={[
                      { label: "→", value: "to-r" },
                      { label: "↘", value: "to-br" },
                      { label: "↓", value: "to-b" },
                      { label: "↙", value: "to-bl" },
                      { label: "←", value: "to-l" },
                      { label: "↗", value: "to-tr" },
                    ]}
                    value={styles.bgGradientDir ?? "to-r"}
                    onChange={(v) => update({ bgGradientDir: v as BlockStyles["bgGradientDir"] })}
                  />
                </div>
              </>
            )}

            {/* Image */}
            {styles.bgType === "image" && (
              <>
                <div>
                  <FieldLabel>Background Image</FieldLabel>
                  <BgImageUpload
                    value={styles.bgImage}
                    onChange={(v) => update({ bgImage: v })}
                  />
                </div>
                <div>
                  <FieldLabel>Image Size</FieldLabel>
                  <PremiumSegmentedControl
                    options={[
                      { label: "Cover", value: "cover" },
                      { label: "Contain", value: "contain" },
                      { label: "Repeat", value: "repeat" },
                    ]}
                    value={styles.bgImageSize ?? "cover"}
                    onChange={(v) => update({ bgImageSize: v as BlockStyles["bgImageSize"] })}
                  />
                </div>
                <div>
                  <FieldLabel>Image Position</FieldLabel>
                  <PremiumSegmentedControl
                    options={[
                      { label: "Top", value: "top" },
                      { label: "Center", value: "center" },
                      { label: "Bottom", value: "bottom" },
                    ]}
                    value={styles.bgImagePos ?? "center"}
                    onChange={(v) => update({ bgImagePos: v as BlockStyles["bgImagePos"] })}
                  />
                </div>
                <ToggleRow
                  label="Fixed / Parallax"
                  checked={!!styles.bgImageFixed}
                  onChange={(v) => update({ bgImageFixed: v })}
                />
                <ToggleRow
                  label="Dark Overlay"
                  checked={!!styles.bgOverlay}
                  onChange={(v) => update({ bgOverlay: v })}
                />
                {styles.bgOverlay && (
                  <>
                    <div>
                      <FieldLabel>Overlay Color</FieldLabel>
                      <PremiumColorRow
                        value={styles.bgOverlayColor ?? "#000000"}
                        placeholder="#000000"
                        onChange={(v) => update({ bgOverlayColor: v })}
                      />
                    </div>
                    <div>
                      <FieldLabel>Overlay Opacity</FieldLabel>
                      <PremiumSegmentedControl
                        options={[
                          { label: "10%", value: "10" },
                          { label: "20%", value: "20" },
                          { label: "40%", value: "40" },
                          { label: "60%", value: "60" },
                          { label: "80%", value: "80" },
                        ]}
                        value={styles.bgOverlayOpacity ?? "40"}
                        onChange={(v) => update({ bgOverlayOpacity: v as BlockStyles["bgOverlayOpacity"] })}
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </StyleAccordion>

          {/* 5. Section Effects */}
          <StyleAccordion
            title="Section Effects"
            icon={Layers}
            isOpen={openSection === "effects"}
            onToggle={() => toggleSection("effects")}
          >
            <div>
              <FieldLabel>Box Shadow</FieldLabel>
              <PremiumSegmentedControl
                options={[
                  { label: "None", value: "none" },
                  { label: "Soft", value: "sm" },
                  { label: "Mid", value: "md" },
                  { label: "High", value: "lg" },
                ]}
                value={styles.sectionShadow ?? "none"}
                onChange={(v) => update({ sectionShadow: v as BlockStyles["sectionShadow"] })}
              />
            </div>
            <ToggleRow
              label="Border Top"
              checked={!!styles.borderTop}
              onChange={(v) => update({ borderTop: v })}
            />
            <ToggleRow
              label="Border Bottom"
              checked={!!styles.borderBottom}
              onChange={(v) => update({ borderBottom: v })}
            />
            {(styles.borderTop || styles.borderBottom) && (
              <div>
                <FieldLabel>Border Color</FieldLabel>
                <PremiumColorRow
                  value={styles.sectionBorderColor ?? "#e5e7eb"}
                  placeholder="#e5e7eb"
                  onChange={(v) => update({ sectionBorderColor: v })}
                />
              </div>
            )}
          </StyleAccordion>

          {/* 6. Cards & Inner Containers (Conditional) */}
          {hasCards && (
            <StyleAccordion
              title="Cards & Grid Containers"
              icon={LayoutGrid}
              isOpen={openSection === "cards"}
              onToggle={() => toggleSection("cards")}
            >
              <div>
                <FieldLabel>Card Background</FieldLabel>
                <PremiumColorRow
                  value={styles.cardBg}
                  placeholder="#ffffff"
                  onChange={(v) => update({ cardBg: v })}
                />
              </div>

              <div>
                <FieldLabel>Card Corner Radius</FieldLabel>
                <PremiumSegmentedControl
                  options={[
                    { label: "MD", value: "md" },
                    { label: "LG", value: "lg" },
                    { label: "XL", value: "xl" },
                  ]}
                  value={styles.cardRadius}
                  onChange={(v) => update({ cardRadius: v as BlockStyles["cardRadius"] })}
                />
              </div>

              <div>
                <FieldLabel>Card Drop Shadow</FieldLabel>
                <PremiumSegmentedControl
                  options={[
                    { label: "None", value: "none" },
                    { label: "Soft", value: "sm" },
                    { label: "Elevated", value: "md" },
                  ]}
                  value={styles.cardShadow}
                  onChange={(v) => update({ cardShadow: v as BlockStyles["cardShadow"] })}
                />
              </div>
            </StyleAccordion>
          )}

        </div>

        {/* Panel Footer / Reset Control */}
        <div className="px-6 py-4 border-t border-gray-100 bg-white flex-shrink-0 space-y-2">
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-black text-white rounded-xl text-[11px] font-bold hover:bg-gray-900 transition-all flex items-center justify-center gap-2 uppercase tracking-wider shadow-md shadow-black/5 hover:scale-[1.01] active:scale-[0.99]"
          >
            Apply &amp; Close
          </button>

          <button
            onClick={() => onStyleChange({})}
            className="w-full py-2.5 text-[10px] font-bold text-gray-400 hover:text-red-500 transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider"
          >
            <RotateCcw size={11} />
            Reset Custom Styling
          </button>
        </div>
    </aside>
  );
}
