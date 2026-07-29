const express        = require("express");
const router         = express.Router();
const archiver = require("archiver");
const BuilderProject = require("../models/BuilderProject");
const { auth }       = require("../middleware/auth");
const { generateHtml }    = require("../generators/html");
const { generateNextjs }  = require("../generators/nextjs");
const { generateLaravel } = require("../generators/laravel");

// ── V2 helpers: JS port of frontend lib/stylesToCSS + generateCSS + generateHTML ──

const UNITLESS = new Set(["opacity","zIndex","fontWeight","lineHeight","flex","flexGrow","flexShrink","order"]);
const VOID_TAGS = new Set(["img","input","br","hr","meta","link","area","base","embed","source","track","wbr"]);

function camelToKebab(str) {
  return str.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}
function addUnit(key, value) {
  if (typeof value === "number" && !UNITLESS.has(key)) return `${value}px`;
  return String(value);
}
function stylesToCSS(styles) {
  if (!styles) return "";
  return Object.entries(styles)
    .filter(([, v]) => v !== undefined && v !== "" && v !== null)
    .map(([k, v]) => `${camelToKebab(k)}: ${addUnit(k, v)}`)
    .join("; ");
}
function hasKeys(obj) {
  return !!obj && Object.keys(obj).length > 0;
}

function walkElementCSS(el, rules) {
  const desktop = stylesToCSS(el.styles && el.styles.desktop);
  if (desktop) rules.push(`[data-id="${el.id}"] { ${desktop} }`);
  if (hasKeys(el.styles && el.styles.tablet)) {
    const tablet = stylesToCSS(el.styles.tablet);
    if (tablet) rules.push(`@media (max-width: 991px) { [data-id="${el.id}"] { ${tablet} } }`);
  }
  if (hasKeys(el.styles && el.styles.mobile)) {
    const mobile = stylesToCSS(el.styles.mobile);
    if (mobile) rules.push(`@media (max-width: 479px) { [data-id="${el.id}"] { ${mobile} } }`);
  }
  if (Array.isArray(el.children)) el.children.forEach((c) => walkElementCSS(c, rules));
}

function generateElementsCSS(elements, classes, tokens) {
  const rules = [];
  // 1. Tokens → :root
  if (tokens) {
    const vars = [];
    (tokens.colors || []).forEach((c) => vars.push(`  --color-${c.name}: ${c.value};`));
    (tokens.fonts  || []).forEach((f) => vars.push(`  --font-${f.name}: ${f.family};`));
    Object.entries(tokens.spacing || {}).forEach(([k, v]) => vars.push(`  --space-${k}: ${v};`));
    if (vars.length) rules.push(`:root {\n${vars.join("\n")}\n}`);
  }
  // 2. Named classes
  (classes || []).forEach((cls) => {
    const d = stylesToCSS(cls.styles && cls.styles.desktop);
    if (d) rules.push(`.${cls.name} { ${d} }`);
    if (hasKeys(cls.styles && cls.styles.tablet)) {
      const t = stylesToCSS(cls.styles.tablet);
      if (t) rules.push(`@media (max-width: 991px) { .${cls.name} { ${t} } }`);
    }
    if (hasKeys(cls.styles && cls.styles.mobile)) {
      const m = stylesToCSS(cls.styles.mobile);
      if (m) rules.push(`@media (max-width: 479px) { .${cls.name} { ${m} } }`);
    }
  });
  // 3. Element overrides
  (elements || []).forEach((el) => walkElementCSS(el, rules));
  return rules.join("\n");
}

function escapeAttr(str) {
  return String(str).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}
function escapeText(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function renderNode(el) {
  const { tag, id, className, content, attrs, children } = el;
  const dataId   = ` data-id="${id}"`;
  const classStr = className ? ` class="${escapeAttr(className)}"` : "";
  const attrsStr = attrs
    ? Object.entries(attrs).filter(([,v]) => v != null).map(([k,v]) => `${k}="${escapeAttr(v)}"`).join(" ")
    : "";
  const attrsOut = attrsStr ? " " + attrsStr : "";
  if (VOID_TAGS.has(tag)) return `<${tag}${dataId}${classStr}${attrsOut}>`;
  const inner = Array.isArray(children) && children.length > 0
    ? children.map(renderNode).join("")
    : content ? escapeText(content) : "";
  return `<${tag}${dataId}${classStr}${attrsOut}>${inner}</${tag}>`;
}

function generateElementsHTML(elements) {
  return (elements || []).map(renderNode).join("\n");
}

function buildV2HtmlFile(elements, classes, tokens, title) {
  const css  = generateElementsCSS(elements, classes, tokens);
  const body = generateElementsHTML(elements);
  const reset = `*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,sans-serif}img{max-width:100%;display:block}a{color:inherit}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeText(title || "Website")}</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
${body}
</body>
</html>`;
}

// ── POST /api/export/elements — V2 clean HTML+CSS export ─────────────────────
router.post("/elements", auth, async (req, res) => {
  try {
    const { elements, classes, tokens, title, businessName } = req.body;
    if (!Array.isArray(elements) || elements.length === 0)
      return res.status(400).json({ message: "elements array is required and must not be empty" });

    const css  = generateElementsCSS(elements, classes, tokens);
    const reset = `*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,sans-serif}img{max-width:100%;display:block}a{color:inherit}\n\n`;
    const body = generateElementsHTML(elements);
    const pageTitle = title || businessName || "Website";

    const htmlFile = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeText(pageTitle)}</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
${body}
</body>
</html>`;

    const cssFile = reset + css;
    const slug = (businessName || "website").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const zipName = `${slug}-v2.zip`;
    const folder  = `${slug}/`;

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${zipName}"`);

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.on("error", (err) => { throw err; });
    archive.pipe(res);
    archive.append(htmlFile, { name: folder + "index.html" });
    archive.append(cssFile,  { name: folder + "style.css"  });
    archive.append(
      `# ${pageTitle}\n\nExported from LHRWEB Builder V2.\n\nOpen index.html in any browser.\n`,
      { name: folder + "README.md" }
    );
    await archive.finalize();
  } catch (err) {
    console.error("V2 export error:", err);
    if (!res.headersSent) res.status(500).json({ message: "Export failed" });
  }
});

// POST /api/export
router.post("/", auth, async (req, res) => {
  try {
    const { projectId, stack, database } = req.body;
    if (!projectId) return res.status(400).json({ message: "projectId required" });
    if (!["html", "nextjs", "laravel"].includes(stack))
      return res.status(400).json({ message: "stack must be html | nextjs | laravel" });

    const project = await BuilderProject.findOne({ _id: projectId, userId: req.user.userId });
    if (!project) return res.status(404).json({ message: "Project not found" });

    let files;
    if (stack === "html")    files = generateHtml(project);
    else if (stack === "nextjs") files = generateNextjs(project, database);
    else                     files = generateLaravel(project, database);

    const slug = (project.businessName || "website").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const zipName = `${slug}-${stack}.zip`;
    const folder  = `${slug}/`;

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${zipName}"`);

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.on("error", (err) => { throw err; });
    archive.pipe(res);

    for (const [filepath, content] of Object.entries(files)) {
      archive.append(content, { name: folder + filepath });
    }

    await archive.finalize();
  } catch (err) {
    console.error("Export error:", err);
    if (!res.headersSent) res.status(500).json({ message: "Export failed" });
  }
});

module.exports = router;
