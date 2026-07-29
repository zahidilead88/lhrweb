const { outputs, ALLOWED_ATTRS } = require("./schemas");

// ── Stage 1: Extract — strip fences / commentary, isolate the JSON payload ────

function extractJson(text) {
  if (typeof text !== "string") return null;
  let t = text.trim();
  // strip markdown fences anywhere
  t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  // isolate first { … last } (or [ … ])
  const firstObj = t.indexOf("{");
  const firstArr = t.indexOf("[");
  let start = -1, open, close;
  if (firstObj !== -1 && (firstArr === -1 || firstObj < firstArr)) { start = firstObj; open = "{"; close = "}"; }
  else if (firstArr !== -1) { start = firstArr; open = "["; close = "]"; }
  if (start === -1) return null;
  const end = t.lastIndexOf(close);
  if (end <= start) return null;
  return t.slice(start, end + 1);
}

// ── Stage 4: Structural checks — depth / node count / duplicate IDs ────────────

function walkElements(elements, fn, depth = 1) {
  let count = 0;
  let maxDepth = depth;
  for (const el of elements || []) {
    if (!el || typeof el !== "object") continue;
    count++;
    fn(el, depth);
    if (Array.isArray(el.children) && el.children.length) {
      const sub = walkElements(el.children, fn, depth + 1);
      count += sub.count;
      maxDepth = Math.max(maxDepth, sub.maxDepth);
    }
  }
  return { count, maxDepth };
}

function structuralCheck(elements, { maxNodes = 300, maxDepth = 8 } = {}) {
  const errors = [];
  const autoFixes = [];
  const seen = new Set();
  const stats = walkElements(elements, (el) => {
    if (!el.id || typeof el.id !== "string" || seen.has(el.id) || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(el.id)) {
      el.id = `el-${require("crypto").randomUUID().slice(0, 8)}`;
      autoFixes.push("regenerated-id");
    }
    seen.add(el.id);
  });
  if (stats.count > maxNodes) errors.push(`Too many elements: ${stats.count} (max ${maxNodes})`);
  if (stats.maxDepth > maxDepth) errors.push(`Tree too deep: ${stats.maxDepth} (max ${maxDepth})`);
  return { errors, autoFixes, nodeCount: stats.count };
}

// ── Stage 5: Sanitize — same trust level as user input ────────────────────────

const SAFE_HREF = /^(https?:\/\/|mailto:|tel:|#|\/)/i;
const SAFE_SRC  = /^(https?:\/\/|\/|data:image\/)/i;
const STYLE_KEY = /^[a-zA-Z][a-zA-Z0-9]{0,49}$/;
const STYLE_VALUE_BLOCK = /(javascript\s*:|expression\s*\(|<\s*script)/i;

function sanitizeStyleObject(obj, autoFixes) {
  if (!obj || typeof obj !== "object") return {};
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (!STYLE_KEY.test(k)) { autoFixes.push(`dropped-style-key:${k.slice(0, 20)}`); continue; }
    const sv = typeof v === "number" ? v : String(v);
    if (typeof sv === "string") {
      if (STYLE_VALUE_BLOCK.test(sv)) { autoFixes.push(`blocked-style-value:${k}`); continue; }
      if (/url\s*\(/i.test(sv) && !/url\s*\(\s*['"]?(https:\/\/|data:image\/)/i.test(sv)) {
        autoFixes.push(`blocked-style-url:${k}`);
        continue;
      }
    }
    out[k] = sv;
  }
  return out;
}

function sanitizeStyles(styles, autoFixes) {
  const s = styles && typeof styles === "object" ? styles : {};
  const out = { desktop: sanitizeStyleObject(s.desktop, autoFixes) };
  if (s.tablet) out.tablet = sanitizeStyleObject(s.tablet, autoFixes);
  if (s.mobile) out.mobile = sanitizeStyleObject(s.mobile, autoFixes);
  return out;
}

function sanitizeElement(el, autoFixes) {
  // content XOR children — auto-fix: containers keep children, drop content
  if (el.content && Array.isArray(el.children) && el.children.length > 0) {
    delete el.content;
    autoFixes.push("dropped-content-on-container");
  }
  // attrs: whitelist + scheme checks
  if (el.attrs && typeof el.attrs === "object") {
    const clean = {};
    for (const [k, v] of Object.entries(el.attrs)) {
      const key = k.toLowerCase();
      if (!ALLOWED_ATTRS.includes(key)) { autoFixes.push(`dropped-attr:${key.slice(0, 20)}`); continue; }
      const val = String(v);
      if (key === "href" && !SAFE_HREF.test(val)) { autoFixes.push("blocked-href"); continue; }
      if (key === "src" && !SAFE_SRC.test(val) && !val.startsWith("__PLACEHOLDER__")) { autoFixes.push("blocked-src"); continue; }
      if (key === "data-svg" && /<\s*script|on\w+\s*=/i.test(val)) { autoFixes.push("blocked-svg"); continue; }
      clean[key] = val;
    }
    el.attrs = clean;
  }
  // className: normalize to css-safe slug
  if (el.className) {
    const slug = String(el.className).toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
    if (slug !== el.className) autoFixes.push("normalized-classname");
    if (slug) el.className = slug; else delete el.className;
  }
  el.styles = sanitizeStyles(el.styles, autoFixes);
  if (!Array.isArray(el.children)) el.children = [];
}

function sanitizeTree(elements, autoFixes) {
  walkElements(elements, (el) => sanitizeElement(el, autoFixes));
}

// ── Stage 6: Semantic lint — warnings only ─────────────────────────────────────

function lintElements(elements) {
  const warnings = [];
  let h1Count = 0, loremFound = false, missingAlt = 0, emptySections = 0;
  walkElements(elements, (el) => {
    if (el.tag === "h1") h1Count++;
    if (el.content && /lorem ipsum|your (headline|text|content) here/i.test(el.content)) loremFound = true;
    if (el.tag === "img" && (!el.attrs || !el.attrs.alt)) missingAlt++;
    if (el.tag === "section" && (!el.children || !el.children.length) && !el.content) emptySections++;
  });
  if (loremFound)       warnings.push("placeholder-text-detected");
  if (missingAlt > 0)   warnings.push(`missing-alt-text:${missingAlt}`);
  if (emptySections)    warnings.push(`empty-sections:${emptySections}`);
  if (h1Count > 1)      warnings.push(`multiple-h1:${h1Count}`);
  return warnings;
}

// ── Pipeline entry ─────────────────────────────────────────────────────────────
// Returns { ok:true, data, warnings, autoFixes, nodeCount }
//      or { ok:false, stage, errors }

function validateOutput(op, raw, opts = {}) {
  const schema = outputs[op];
  if (!schema) return { ok: false, stage: "config", errors: [`Unknown operation: ${op}`] };

  // Stage 1-2: extract + parse (skip if already an object)
  let parsed = raw;
  if (typeof raw === "string") {
    const jsonStr = extractJson(raw);
    if (!jsonStr) return { ok: false, stage: "extract", errors: ["No JSON object found in output"] };
    try {
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      return { ok: false, stage: "parse", errors: [`JSON syntax error: ${e.message}`] };
    }
  }

  // Per-op normalization of common shape drift
  if (opts.normalize) parsed = opts.normalize(parsed);

  // Stage 3: Zod
  const result = schema.safeParse(parsed);
  if (!result.success) {
    const errors = result.error.issues.slice(0, 5).map(
      (i) => `${i.path.join(".") || "(root)"}: ${i.message}`
    );
    return { ok: false, stage: "zod", errors };
  }
  const data = result.data;

  // Stage 4-6 apply to element trees only
  const autoFixes = [];
  let warnings = [];
  let nodeCount = 0;
  const trees = [];
  if (Array.isArray(data.elements)) trees.push(data.elements);
  else if (data.tag) trees.push([data]);

  for (const tree of trees) {
    const st = structuralCheck(tree, { maxNodes: opts.maxNodes ?? 300, maxDepth: opts.maxDepth ?? 8 });
    if (st.errors.length) return { ok: false, stage: "structural", errors: st.errors };
    autoFixes.push(...st.autoFixes);
    nodeCount += st.nodeCount;
    sanitizeTree(tree, autoFixes);
    warnings = warnings.concat(lintElements(tree));
  }

  return { ok: true, data, warnings, autoFixes, nodeCount };
}

module.exports = { validateOutput, extractJson, walkElements };
