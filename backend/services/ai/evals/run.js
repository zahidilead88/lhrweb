#!/usr/bin/env node
// Ch 9.2 — offline eval runner. Usage:
//   cd backend && GEMINI_API_KEY=... node services/ai/evals/run.js [op]
// Runs fixtures for one op (or all), reports pass rate / confidence / tokens / repairs.
// Required before merging any prompt change (Ch 2.4).

process.env.AI_QUOTA_DISABLED = "true";

const mongoose = require("mongoose");
mongoose.set("bufferCommands", false); // no DB in eval runs — AiCallLog writes fail fast & are caught

const fixtures = require("./fixtures");
const { runAiOperation } = require("../index");
const { getPrompt } = require("../prompts");

const FAKE_USER = { _id: new mongoose.Types.ObjectId(), role: "admin" };

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is required to run evals.");
    process.exit(1);
  }
  const only = process.argv[2];
  const ops = only ? [only] : Object.keys(fixtures);

  let totalPass = 0, totalRun = 0;

  for (const op of ops) {
    const cases = fixtures[op];
    if (!cases) { console.error(`No fixtures for op "${op}"`); continue; }
    const version = getPrompt(op).version;
    console.log(`\n── ${op} (prompt v${version}) — ${cases.length} fixtures ──`);

    const rows = [];
    for (const c of cases) {
      const started = Date.now();
      try {
        const { meta } = await runAiOperation(op, c.input, FAKE_USER);
        rows.push({ name: c.name, ok: true, confidence: meta.confidence, tokens: meta.tokensUsed, repaired: meta.repaired || "-", ms: Date.now() - started });
        totalPass++;
      } catch (e) {
        rows.push({ name: c.name, ok: false, error: `${e.code || ""} ${e.message}`.trim().slice(0, 60), ms: Date.now() - started });
      }
      totalRun++;
    }

    for (const r of rows) {
      console.log(
        r.ok
          ? `  ✓ ${r.name.padEnd(20)} conf=${String(r.confidence).padStart(3)} tokens=${String(r.tokens).padStart(6)} repair=${r.repaired} ${r.ms}ms`
          : `  ✗ ${r.name.padEnd(20)} ${r.error} ${r.ms}ms`
      );
    }
    const passed = rows.filter((r) => r.ok);
    const avgConf = passed.length ? Math.round(passed.reduce((s, r) => s + r.confidence, 0) / passed.length) : 0;
    console.log(`  → ${passed.length}/${rows.length} passed, avg confidence ${avgConf}`);
  }

  console.log(`\nTOTAL: ${totalPass}/${totalRun} passed (target ≥ 95% after repairs)`);
  process.exit(totalPass === totalRun ? 0 : 1);
}

main();
