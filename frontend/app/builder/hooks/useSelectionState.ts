"use client";

// Phase 0 (docs/BLUEPRINT.md §5) — selection state extracted out of page.tsx.
// Owns: element selection, frame selection, free-canvas multi-select, and
// in-frame element multi-select. Does NOT own `selectedId` (the active page
// in the page switcher) — that's document selection, not canvas selection.

import { useCallback, useState } from "react";

export function useSelectionState() {
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [selectedFrameId, setSelectedFrameId]     = useState<string | null>(null);
  const [freeSelectedIds, setFreeSelectedIds]     = useState<string[]>([]);
  const [selectedFrameElementIds, setSelectedFrameElementIds] = useState<string[]>([]);

  // Consolidated clear — equivalent to the ad-hoc `setX(null)` triples scattered
  // through page.tsx today. Existing inline call sites are unaffected by this
  // (they still call the same setters); this is available for new code and as
  // a natural follow-up to consolidate the scattered sites onto later.
  const clearSelection = useCallback(() => {
    setSelectedElementId(null);
    setSelectedFrameId(null);
    setFreeSelectedIds([]);
    setSelectedFrameElementIds([]);
  }, []);

  const hasSelection =
    selectedElementId !== null ||
    selectedFrameId !== null ||
    freeSelectedIds.length > 0 ||
    selectedFrameElementIds.length > 0;

  return {
    selectedElementId, setSelectedElementId,
    selectedFrameId, setSelectedFrameId,
    freeSelectedIds, setFreeSelectedIds,
    selectedFrameElementIds, setSelectedFrameElementIds,
    clearSelection,
    hasSelection,
  };
}

export type SelectionState = ReturnType<typeof useSelectionState>;
