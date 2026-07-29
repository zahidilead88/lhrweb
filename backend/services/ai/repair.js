const { validateOutput } = require("./validate");

// ── Stage 1: local deterministic fixes (zero cost) ─────────────────────────────

function localFixes(text) {
  if (typeof text !== "string") return [];
  const candidates = [];

  // remove trailing commas before } or ]
  const noTrailing = text.replace(/,\s*([}\]])/g, "$1");
  if (noTrailing !== text) candidates.push(noTrailing);

  // balance brackets: append missing closers
  const balance = (t) => {
    let out = t;
    const stack = [];
    let inStr = false, esc = false;
    for (const ch of t) {
      if (esc) { esc = false; continue; }
      if (ch === "\\") { esc = true; continue; }
      if (ch === '"') { inStr = !inStr; continue; }
      if (inStr) continue;
      if (ch === "{" || ch === "[") stack.push(ch === "{" ? "}" : "]");
      else if (ch === "}" || ch === "]") stack.pop();
    }
    if (inStr) out += '"';
    while (stack.length) out += stack.pop();
    return out;
  };
  const balanced = balance(noTrailing);
  if (balanced !== noTrailing) candidates.push(balanced.replace(/,\s*([}\]])/g, "$1"));

  return candidates;
}

// ── Repair loop — up to 3 stages, returns first output that validates ─────────
//
// callModel({ system, user, temperature, maxOutputTokens }) → { text, usage }
// rebuildOriginal(extraRules, tempDelta) → same signature, re-runs original prompt

async function repairLoop({ op, rawText, firstFailure, validateOpts, callModel, rebuildOriginal }) {
  const attempts = [{ stage: "original", errors: firstFailure.errors }];

  // Stage 1 — local deterministic fixes
  for (const candidate of localFixes(rawText)) {
    const v = validateOutput(op, candidate, validateOpts);
    if (v.ok) return { ...v, repaired: "local", attempts };
  }
  attempts.push({ stage: "local", errors: ["local fixes did not validate"] });

  // Stage 2 — model fixes its own JSON (temp 0.1)
  try {
    const fix = await callModel({
      system: "You are a JSON repair tool. You output only corrected JSON — no markdown, no commentary.",
      user: `This JSON failed validation with these errors:\n${firstFailure.errors.join("\n")}\n\nReturn the corrected JSON only:\n\n${String(rawText).slice(0, 30000)}`,
      temperature: 0.1,
    });
    const v = validateOutput(op, fix.text, validateOpts);
    if (v.ok) return { ...v, repaired: "model", attempts, extraUsage: fix.usage };
    attempts.push({ stage: "model-repair", errors: v.errors });
  } catch (e) {
    attempts.push({ stage: "model-repair", errors: [e.message] });
  }

  // Stage 3 — regenerate with the violated rules restated, temperature lowered
  if (rebuildOriginal) {
    try {
      const regen = await rebuildOriginal(firstFailure.errors, -0.2);
      const v = validateOutput(op, regen.text, validateOpts);
      if (v.ok) return { ...v, repaired: "regen", attempts, extraUsage: regen.usage };
      attempts.push({ stage: "regen", errors: v.errors });
    } catch (e) {
      attempts.push({ stage: "regen", errors: [e.message] });
    }
  }

  return { ok: false, attempts };
}

module.exports = { repairLoop, localFixes };
