"use client";

// Phase 0 (docs/BLUEPRINT.md §5) — canvas-mode/viewport state extracted out of
// page.tsx. Owns which editor is active (Flow vs Free), the active drawing
// tool, zoom/viewport, and the preview device/mode toggles.

import { useState } from "react";
import type { CanvasTool } from "@/types/builder";

export function useCanvasModeState() {
  const [canvasMode, setCanvasModeState]     = useState<"flow" | "free">("flow");
  const [canvasViewport, setCanvasViewport]  = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [canvasZoom, setCanvasZoom]          = useState(0.75);
  const [activeTool, setActiveTool]          = useState<CanvasTool>("move");
  const [previewMode, setPreviewMode]        = useState<"none" | "split" | "full">("none");
  const [previewDevice, setPreviewDevice]    = useState<"desktop" | "mobile">("desktop");

  return {
    canvasMode, setCanvasModeState,
    canvasViewport, setCanvasViewport,
    canvasZoom, setCanvasZoom,
    activeTool, setActiveTool,
    previewMode, setPreviewMode,
    previewDevice, setPreviewDevice,
  };
}

export type CanvasModeState = ReturnType<typeof useCanvasModeState>;
