const { GoogleGenerativeAI } = require("@google/generative-ai");

const PRIMARY_MODEL  = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || null;

const RETRYABLE = /(^| )(429|500|503)( |$)|quota|overloaded|unavailable|deadline/i;

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function rawCall(modelName, { system, user, temperature, maxOutputTokens, timeoutMs }) {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set in .env");
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: modelName,
    ...(system ? { systemInstruction: system } : {}),
  });

  const call = model.generateContent({
    contents: [{ role: "user", parts: [{ text: user }] }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature,
      maxOutputTokens,
    },
  });

  const timeout = new Promise((_, rej) =>
    setTimeout(() => rej(new Error(`Model call timed out after ${timeoutMs}ms`)), timeoutMs)
  );

  const result = await Promise.race([call, timeout]);
  const response = result.response;
  const text = response.text().trim();
  const usage = response.usageMetadata || {};
  const candidate = (response.candidates || [])[0] || {};

  return {
    text,
    usage: {
      inputTokens:  usage.promptTokenCount || 0,
      outputTokens: usage.candidatesTokenCount || 0,
    },
    finishReason: candidate.finishReason || "STOP",
    model: modelName,
  };
}

// callModel — retries on transient errors, then optional fallback model (Ch 10 Level 1)
async function callModel(opts) {
  const config = {
    system:          opts.system || "",
    user:            opts.user,
    temperature:     Math.max(0, Math.min(2, opts.temperature ?? 0.7)),
    maxOutputTokens: opts.maxOutputTokens ?? 8192,
    timeoutMs:       opts.timeoutMs ?? 60000,
  };

  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await rawCall(PRIMARY_MODEL, config);
    } catch (e) {
      lastErr = e;
      if (!RETRYABLE.test(e.message || "")) break;
      await sleep(attempt === 0 ? 1000 : 3000);
    }
  }

  if (FALLBACK_MODEL) {
    try {
      const r = await rawCall(FALLBACK_MODEL, config);
      r.degraded = true;
      return r;
    } catch (e) {
      lastErr = e;
    }
  }

  throw lastErr;
}

module.exports = { callModel, PRIMARY_MODEL };
