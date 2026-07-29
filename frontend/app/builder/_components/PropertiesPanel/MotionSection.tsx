"use client";

import { Zap, X, Sparkles } from "lucide-react";
import type { AnimationConfig, AnimationProps, TransitionConfig } from "@/types/builder";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Presets ───────────────────────────────────────────────────────────────────

const PRESETS: Record<string, { label: string; initial: AnimationProps; animate: AnimationProps }> = {
  fadeIn:      { label: "Fade In",    initial: { opacity: 0 },             animate: { opacity: 1 } },
  fadeInUp:    { label: "Fade Up",    initial: { opacity: 0, y: 30 },      animate: { opacity: 1, y: 0 } },
  fadeInDown:  { label: "Fade Down",  initial: { opacity: 0, y: -30 },     animate: { opacity: 1, y: 0 } },
  fadeInLeft:  { label: "Fade Left",  initial: { opacity: 0, x: -40 },     animate: { opacity: 1, x: 0 } },
  fadeInRight: { label: "Fade Right", initial: { opacity: 0, x: 40 },      animate: { opacity: 1, x: 0 } },
  zoomIn:      { label: "Zoom In",    initial: { opacity: 0, scale: 0.85 }, animate: { opacity: 1, scale: 1 } },
  zoomOut:     { label: "Zoom Out",   initial: { opacity: 0, scale: 1.15 }, animate: { opacity: 1, scale: 1 } },
  slideUp:     { label: "Slide Up",   initial: { y: 60, opacity: 0 },      animate: { y: 0, opacity: 1 } },
};

const EASE_OPTIONS = [
  { value: "ease",        label: "Ease" },
  { value: "ease-in",     label: "In" },
  { value: "ease-out",    label: "Out" },
  { value: "ease-in-out", label: "In-Out" },
  { value: "linear",      label: "Lin" },
] as const;

// ── Small helpers ─────────────────────────────────────────────────────────────

function Seg({
  options, value, onChange,
}: {
  options: readonly { value: string; label: string }[];
  value?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-0.5 bg-gray-50 border border-gray-100 rounded-lg p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-md py-1 text-[10px] font-bold transition-all ${
            value === o.value
              ? "bg-white text-black shadow-sm border border-gray-100"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function SliderRow({
  label, value, min, max, step, unit, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number;
  unit: string; onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</p>
        <span className="text-[10px] font-mono text-gray-400">{value.toFixed(1)}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 accent-[#6344d4]"
      />
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</span>
      <button
        onClick={onChange}
        className={`relative w-8 h-4 rounded-full transition-all ${checked ? "bg-[#6344d4]" : "bg-gray-200"}`}
      >
        <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${checked ? "left-4" : "left-0.5"}`} />
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  animation?: AnimationConfig;
  projectId?: string;
  onChange: (animation: AnimationConfig | undefined) => void;
}

export default function MotionSection({ animation, projectId, onChange }: Props) {
  const cfg = animation;

  const preset      = cfg?.preset ?? "none";
  const trigger     = cfg?.whileInView ? "scroll" : "load";
  const duration    = cfg?.transition?.duration ?? 0.4;
  const delay       = cfg?.transition?.delay    ?? 0;
  const ease        = cfg?.transition?.ease     ?? "ease";
  const hoverScale  = cfg?.whileHover?.scale;
  const tapScale    = cfg?.whileTap?.scale;
  const once        = cfg?.viewport?.once !== false;

  const hasEntry  = !!cfg && preset !== "none";
  const hasHover  = hoverScale !== undefined;
  const hasTap    = tapScale   !== undefined;
  const hasAny    = hasEntry || hasHover || hasTap;

  // Derive transition object from current sliders
  function makeTr(): TransitionConfig {
    return { duration, delay, ease: ease as TransitionConfig["ease"] };
  }

  function applyPreset(key: string) {
    if (key === "none") {
      if (!hasHover && !hasTap) { onChange(undefined); return; }
      const next = { ...cfg } as AnimationConfig;
      delete next.preset; delete next.initial; delete next.animate; delete next.whileInView; delete next.viewport;
      onChange(next);
      return;
    }
    const p = PRESETS[key];
    if (!p) return;
    const next: AnimationConfig = {
      ...(cfg ?? {}),
      preset: key,
      initial: p.initial,
      transition: makeTr(),
    };
    if (trigger === "scroll") {
      next.whileInView = p.animate;
      next.viewport = { once, amount: 0.15 };
      delete next.animate;
    } else {
      next.animate = p.animate;
      delete next.whileInView;
      delete next.viewport;
    }
    onChange(next);
  }

  function setTrigger(t: "load" | "scroll") {
    if (!hasEntry) return;
    const p = PRESETS[preset];
    if (!p) return;
    const next: AnimationConfig = { ...cfg } as AnimationConfig;
    if (t === "scroll") {
      next.whileInView = p.animate;
      next.viewport = { once, amount: 0.15 };
      delete next.animate;
    } else {
      next.animate = p.animate;
      delete next.whileInView;
      delete next.viewport;
    }
    onChange(next);
  }

  function setTransition(patch: Partial<TransitionConfig>) {
    onChange({ ...(cfg ?? {}), transition: { ...makeTr(), ...patch } } as AnimationConfig);
  }

  function setOnce(v: boolean) {
    onChange({ ...(cfg ?? {}), viewport: { ...(cfg?.viewport ?? {}), once: v } } as AnimationConfig);
  }

  function setHoverScale(v: number | undefined) {
    const next = { ...(cfg ?? {}) } as AnimationConfig;
    if (v === undefined) delete next.whileHover;
    else next.whileHover = { scale: v };
    const isEmpty = !next.preset && !next.whileHover && !next.whileTap;
    onChange(isEmpty ? undefined : next);
  }

  function setTapScale(v: number | undefined) {
    const next = { ...(cfg ?? {}) } as AnimationConfig;
    if (v === undefined) delete next.whileTap;
    else next.whileTap = { scale: v };
    const isEmpty = !next.preset && !next.whileHover && !next.whileTap;
    onChange(isEmpty ? undefined : next);
  }

  async function handleAISuggest() {
    const description = window.prompt("Describe the animation (e.g. \"fade in from left with a bounce\"):");
    if (!description?.trim() || !projectId) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/api/builder/animate-element`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ description: description.trim(), projectId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Failed");
      onChange(data.animation);
    } catch (err) {
      alert("AI suggestion failed. Try again.");
    }
  }

  return (
    <div className="border-b border-gray-50">
      {/* Section header */}
      <div className="px-4 py-3 flex items-center gap-2 border-b border-gray-50">
        <Zap size={13} className="text-[#6344d4]" />
        <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex-1">Motion</span>
        {projectId && (
          <button
            onClick={handleAISuggest}
            title="AI animation suggest"
            className="flex items-center gap-1 text-[9px] font-bold text-[#6344d4] hover:text-purple-800 transition-colors mr-2"
          >
            <Sparkles size={10} /> AI
          </button>
        )}
        {hasAny && (
          <button
            onClick={() => onChange(undefined)}
            title="Clear all motion"
            className="text-[9px] font-bold text-red-400 hover:text-red-600 flex items-center gap-0.5 transition-colors"
          >
            <X size={9} /> Clear
          </button>
        )}
      </div>

      <div className="px-4 pb-4 pt-3 space-y-3">

        {/* ── Entry animation ─────────────────────────────────── */}
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Entrance</p>
          <select
            value={preset}
            onChange={(e) => applyPreset(e.target.value)}
            className="w-full px-2.5 py-1.5 text-[11px] border border-gray-100 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#6344d4]/15 appearance-none cursor-pointer text-gray-700"
          >
            <option value="none">— None —</option>
            {Object.entries(PRESETS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>

        {hasEntry && (
          <>
            {/* Trigger */}
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Trigger</p>
              <Seg
                value={trigger}
                onChange={(v) => setTrigger(v as "load" | "scroll")}
                options={[
                  { value: "load",   label: "On Load" },
                  { value: "scroll", label: "On Scroll" },
                ]}
              />
            </div>

            {trigger === "scroll" && (
              <Toggle checked={once} onChange={() => setOnce(!once)} label="Play Once" />
            )}

            {/* Duration */}
            <SliderRow
              label="Duration" value={duration} min={0.1} max={2} step={0.1} unit="s"
              onChange={(v) => setTransition({ duration: v })}
            />

            {/* Delay */}
            <SliderRow
              label="Delay" value={delay} min={0} max={1.5} step={0.1} unit="s"
              onChange={(v) => setTransition({ delay: v })}
            />

            {/* Easing */}
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Easing</p>
              <Seg
                value={ease}
                onChange={(v) => setTransition({ ease: v as TransitionConfig["ease"] })}
                options={EASE_OPTIONS}
              />
            </div>
          </>
        )}

        {/* ── Interaction ─────────────────────────────────────── */}
        <div className={`space-y-3 ${hasEntry ? "pt-2 border-t border-gray-50" : ""}`}>
          {hasEntry && (
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Interaction</p>
          )}

          {/* Hover Scale */}
          <div className="space-y-1">
            <Toggle
              checked={hasHover}
              onChange={() => setHoverScale(hasHover ? undefined : 1.05)}
              label="Hover Scale"
            />
            {hasHover && (
              <div className="flex items-center gap-2 pt-0.5">
                <input
                  type="range" min={0.8} max={1.3} step={0.01}
                  value={hoverScale ?? 1.05}
                  onChange={(e) => setHoverScale(parseFloat(e.target.value))}
                  className="flex-1 h-1.5 accent-[#6344d4]"
                />
                <span className="text-[10px] font-mono text-gray-400 w-9 text-right">
                  ×{(hoverScale ?? 1.05).toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Press Scale */}
          <div className="space-y-1">
            <Toggle
              checked={hasTap}
              onChange={() => setTapScale(hasTap ? undefined : 0.95)}
              label="Press Scale"
            />
            {hasTap && (
              <div className="flex items-center gap-2 pt-0.5">
                <input
                  type="range" min={0.7} max={1} step={0.01}
                  value={tapScale ?? 0.95}
                  onChange={(e) => setTapScale(parseFloat(e.target.value))}
                  className="flex-1 h-1.5 accent-[#6344d4]"
                />
                <span className="text-[10px] font-mono text-gray-400 w-9 text-right">
                  ×{(tapScale ?? 0.95).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
