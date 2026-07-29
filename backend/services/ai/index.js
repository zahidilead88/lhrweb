// Ch 1 — the only public entry point for AI operations.
// runAiOperation(op, input, user, { project, existingIds }) → { data, meta }
// Throws AiError with { status, code } on failure. Original content is never touched.

const { getPrompt }        = require("./prompts");
const { buildContext }     = require("./contextBuilder");
const { callModel }        = require("./gemini");
const { validateOutput }   = require("./validate");
const { repairLoop }       = require("./repair");
const { checkQuota, decrementQuota } = require("./quota");
const { dedupeIds, checkIdContract, computeConfidence } = require("./postProcess");
const breaker   = require("./breaker");
const AiCallLog = require("../../models/AiCallLog");

class AiError extends Error {
  constructor(status, code, message, extra = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.extra = extra;
  }
}

const TYPICAL_NODES = { elementsGenerate: 20 };

async function runAiOperation(op, input, user, { project = null, existingIds = [] } = {}) {
  const started = Date.now();
  const promptMod = getPrompt(op);
  const validateOpts = {
    normalize: promptMod.normalize,
    maxNodes:  promptMod.limits?.maxNodes,
    maxDepth:  promptMod.limits?.maxDepth,
  };

  // 1. Quota gate — reject before any cost (A6)
  const quota = await checkQuota(user, promptMod.quotaWeight);
  if (!quota.ok) {
    throw new AiError(402, "QUOTA_EXCEEDED", "Monthly AI quota exceeded.", {
      unitsUsed: quota.unitsUsed, limit: quota.limit, resetsAt: quota.resetsAt,
    });
  }

  // 2-3. Context + prompt assembly
  const context = buildContext(project);
  const { system, user: userPrompt } = promptMod.build(input, context);

  const usage = { inputTokens: 0, outputTokens: 0 };
  const addUsage = (u) => { if (u) { usage.inputTokens += u.inputTokens || 0; usage.outputTokens += u.outputTokens || 0; } };

  const makeCall = (overrides = {}) =>
    callModel({ system, user: userPrompt, ...promptMod.config, ...overrides });

  // Re-runs the ORIGINAL prompt with violated rules appended (repair stage 3)
  const rebuildOriginal = async (errors, tempDelta) => {
    const augmented = `${userPrompt}\n\nIMPORTANT — a previous attempt violated these rules. Do not repeat these mistakes:\n${errors.map((e) => `- ${e}`).join("\n")}`;
    const r = await callModel({
      system,
      user: augmented,
      ...promptMod.config,
      temperature: Math.max(0.1, (promptMod.config.temperature ?? 0.7) + tempDelta),
    });
    return r;
  };

  // 4. Model call — gated by the circuit breaker (Ch 7.2 / Ch 10)
  if (breaker.isOpen()) {
    throw new AiError(503, "AI_UNAVAILABLE", "AI is temporarily paused due to provider issues. Please try again in a few minutes.", { level: breaker.state() });
  }
  let modelResult;
  try {
    modelResult = await makeCall();
    addUsage(modelResult.usage);
    breaker.record(true);
  } catch (e) {
    breaker.record(false);
    await log(user, op, promptMod, usage, null, null, [], false, started, null);
    throw new AiError(503, "AI_UNAVAILABLE", "The AI service is temporarily unavailable. Please try again.", { cause: e.message });
  }

  // 5-6. Validation + repair loop
  let validated = validateOutput(op, modelResult.text, validateOpts);
  let repaired = null;

  if (!validated.ok) {
    const repair = await repairLoop({
      op,
      rawText: modelResult.text,
      firstFailure: validated,
      validateOpts,
      callModel: (o) => callModel({ ...promptMod.config, ...o }).then((r) => { addUsage(r.usage); return r; }),
      rebuildOriginal: (errors, d) => rebuildOriginal(errors, d).then((r) => { addUsage(r.usage); return r; }),
    });
    if (!repair.ok) {
      await log(user, op, promptMod, usage, null, null, [], false, started, modelResult.model);
      throw new AiError(422, "AI_GENERATION_FAILED", "AI returned invalid content after multiple attempts. Please try again.", {
        attempts: repair.attempts.length,
      });
    }
    validated = repair;
    repaired = repair.repaired;
  }

  const data = validated.data;
  const warnings = validated.warnings || [];

  // 7. Post-process — ID contract (edit ops) + cross-generation ID dedup
  if (op === "elementEdit" && input.element) {
    const contract = checkIdContract(input.element, data);
    if (!contract.ok) {
      // one constrained regen, then give up (AI-R5 enforcement)
      try {
        const regen = await rebuildOriginal([contract.reason], -0.2);
        addUsage(regen.usage);
        const v2 = validateOutput(op, regen.text, validateOpts);
        if (v2.ok && checkIdContract(input.element, v2.data).ok) {
          validated = v2;
          repaired = "regen";
        } else {
          throw new Error(contract.reason);
        }
      } catch {
        await log(user, op, promptMod, usage, null, repaired, warnings, false, started, modelResult.model);
        throw new AiError(422, "AI_GENERATION_FAILED", "AI rewrote too much of the selection. Please try again.", { reason: contract.reason });
      }
    }
    validated.data.id = input.element.id; // root id always preserved
  }

  const finalData = validated.data;
  if (Array.isArray(finalData.elements)) dedupeIds(finalData.elements, existingIds);
  else if (finalData.tag) dedupeIds([finalData], existingIds.filter((id) => id !== finalData.id));

  // 8. Confidence (Ch 9.1)
  const confidence = computeConfidence({
    repaired,
    warnings,
    finishReason: modelResult.finishReason,
    nodeCount: validated.nodeCount,
    typicalNodes: TYPICAL_NODES[op],
  });

  // 9. Quota decrement — after success only
  await decrementQuota(user._id || user.userId, promptMod.quotaWeight);

  // 10. Log
  await log(user, op, promptMod, usage, confidence, repaired, warnings, true, started, modelResult.model);

  return {
    data: finalData,
    meta: {
      tokensUsed: usage.inputTokens + usage.outputTokens,
      confidence,
      warnings,
      repaired,
      degraded: !!modelResult.degraded,
    },
  };
}

async function log(user, op, promptMod, usage, confidence, repaired, warnings, success, started, model) {
  try {
    await AiCallLog.create({
      userId: user._id || user.userId,
      op,
      promptVersion: promptMod.version,
      model,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      repaired,
      confidence,
      warnings,
      success,
      ms: Date.now() - started,
    });
  } catch (e) {
    console.error("AiCallLog write failed:", e.message);
  }
}

module.exports = { runAiOperation, AiError };
