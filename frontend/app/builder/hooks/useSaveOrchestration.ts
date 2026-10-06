"use client";

// Phase 0 (docs/BLUEPRINT.md §5) — save orchestration extracted out of
// page.tsx. Owns: dirty/saving/saved/failed state, retry count, the shared
// AbortController for in-flight saves, and the localStorage crash-recovery
// snapshot (write/clear/check). `handleSave()` itself stays in page.tsx —
// it's genuinely page-specific (project, blocks, elements, frames, classes,
// tokens, components all live there) — this hook owns the *state* that
// orchestration produces and consumes, not the save call itself.

import { useCallback, useRef, useState } from "react";
import type { ElementNode, Frame } from "@/types/builder";

export function useSaveOrchestration(projectId: string | undefined) {
  const [saving, setSaving]                     = useState(false);
  const [saved, setSaved]                       = useState(false);
  const [saveFailed, setSaveFailed]             = useState(false);
  const [saveRetryCount, setSaveRetryCount]     = useState(0);
  const saveAbortRef = useRef<AbortController | null>(null);

  const [showRecovery, setShowRecovery]         = useState(false);
  const [recoverySnapshot, setRecoverySnapshot] = useState<{ elements?: ElementNode[]; frames?: Frame[]; timestamp: number } | null>(null);

  // Closure-safe latest-value refs — handleSave's catch block writes a
  // recovery snapshot from whatever elements/frames were current at the time
  // of failure, without needing `elements`/`frames` in its own dependency array.
  const elementsForRecovery = useRef<ElementNode[]>([]);
  const framesForRecovery   = useRef<Frame[]>([]);

  const recoveryKey = useCallback(
    () => `lhrweb_recovery_${projectId ?? "unknown"}`,
    [projectId]
  );

  const writeRecoverySnapshot = useCallback((els?: ElementNode[], frs?: Frame[]) => {
    try {
      const snapshot = {
        elements: els ?? elementsForRecovery.current,
        frames: frs ?? framesForRecovery.current,
        timestamp: Date.now(),
      };
      const json = JSON.stringify(snapshot);
      if (json.length > 4_000_000) return;
      localStorage.setItem(recoveryKey(), json);
    } catch { /* localStorage full or unavailable */ }
  }, [recoveryKey]);

  const clearRecoverySnapshot = useCallback(() => {
    try { localStorage.removeItem(recoveryKey()); } catch {}
  }, [recoveryKey]);

  const checkRecovery = useCallback((projId: string, updatedAt: string) => {
    try {
      const raw = localStorage.getItem(`lhrweb_recovery_${projId}`);
      if (!raw) return;
      const snapshot = JSON.parse(raw);
      if (snapshot.timestamp > new Date(updatedAt).getTime()) {
        setRecoverySnapshot(snapshot);
        setShowRecovery(true);
      }
    } catch { /* corrupt recovery data — ignore */ }
  }, []);

  return {
    saving, setSaving,
    saved, setSaved,
    saveFailed, setSaveFailed,
    saveRetryCount, setSaveRetryCount,
    saveAbortRef,
    showRecovery, setShowRecovery,
    recoverySnapshot, setRecoverySnapshot,
    elementsForRecovery, framesForRecovery,
    recoveryKey,
    writeRecoverySnapshot,
    clearRecoverySnapshot,
    checkRecovery,
  };
}

export type SaveOrchestration = ReturnType<typeof useSaveOrchestration>;
