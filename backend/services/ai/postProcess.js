const crypto = require("crypto");
const { walkElements } = require("./validate");

// ── ID dedup against the FULL existing id set (Ch 12 edge case) ───────────────

function dedupeIds(elements, existingIds = []) {
  const used = new Set(existingIds);
  let regenerated = 0;
  walkElements(elements, (el) => {
    if (!el.id || used.has(el.id)) {
      el.id = `el-${crypto.randomUUID().slice(0, 8)}`;
      regenerated++;
    }
    used.add(el.id);
  });
  return regenerated;
}

// ── AI-R5: edit ops must preserve the root id + a sane share of input ids ─────

function collectIds(elOrEls) {
  const ids = new Set();
  const arr = Array.isArray(elOrEls) ? elOrEls : [elOrEls];
  walkElements(arr, (el) => { if (el.id) ids.add(el.id); });
  return ids;
}

function checkIdContract(inputElement, outputElement) {
  const inputIds  = collectIds(inputElement);
  const outputIds = collectIds(outputElement);
  if (inputElement.id && outputElement.id !== inputElement.id) {
    return { ok: false, reason: `Root id changed: expected "${inputElement.id}", got "${outputElement.id}"` };
  }
  if (inputIds.size >= 4) {
    let survived = 0;
    for (const id of inputIds) if (outputIds.has(id)) survived++;
    const ratio = survived / inputIds.size;
    if (ratio < 0.3) {
      return { ok: false, reason: `Only ${Math.round(ratio * 100)}% of input ids survived (min 30%) — output looks like a rogue rewrite` };
    }
  }
  return { ok: true };
}

// ── Ch 9.1 — confidence computed from observable signals, never self-reported ──

function computeConfidence({ repaired, warnings = [], finishReason, nodeCount, typicalNodes }) {
  let score = 100;
  if (repaired === "model" || repaired === "regen") score -= 25;
  score -= Math.min(30, warnings.length * 10);
  if (finishReason === "MAX_TOKENS") score -= 15;
  if (typicalNodes && nodeCount != null && nodeCount < typicalNodes * 0.3) score -= 10;
  return Math.max(0, score);
}

module.exports = { dedupeIds, checkIdContract, computeConfidence, collectIds };
