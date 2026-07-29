/**
 * Migration: BuilderProject blocks[] → elements[]
 *
 * Converts every existing project's pages[].blocks[] (V1 flat block array)
 * into pages[].elements[] (V2 recursive ElementNode tree).
 *
 * Safety:
 *   - Original blocks[] is preserved in pages[].blocks_backup[]
 *   - Run with DRY_RUN=true to preview changes without writing
 *   - Idempotent: skips pages that already have elements[]
 *
 * Usage:
 *   node scripts/migrateBuilderProjects.js
 *   DRY_RUN=true node scripts/migrateBuilderProjects.js
 */

require("dotenv").config({ path: require("path").join(__dirname, "../backend/.env") });
const mongoose = require("mongoose");

const DRY_RUN = process.env.DRY_RUN === "true";

// ── Inline BuilderProject model (avoids circular require issues) ──────────────
const schema = new mongoose.Schema({}, { strict: false, timestamps: true });
const BuilderProject = mongoose.model("BuilderProject", schema, "builderprojects");

// ── ID generator ──────────────────────────────────────────────────────────────
let _seq = 0;
function uid() {
  _seq++;
  return `el_${Date.now().toString(36)}_${_seq.toString(36)}`;
}

// ── Style helpers ─────────────────────────────────────────────────────────────

function headingStyles(color = "#ffffff", size = "52px", align = "center") {
  return {
    desktop: { fontSize: size, fontWeight: "700", color, textAlign: align, marginBottom: "16px", lineHeight: "1.15" },
    mobile:  { fontSize: size === "52px" ? "32px" : size === "40px" ? "28px" : "22px" },
  };
}

function bodyStyles(color = "rgba(255,255,255,0.7)", align = "center", size = "18px") {
  return {
    desktop: { fontSize: size, color, textAlign: align, maxWidth: "640px", lineHeight: "1.7", margin: "0 auto" },
    mobile:  { fontSize: "15px" },
  };
}

function btnStyles(bg = "#ffffff", color = "#000000", fullWidth = false) {
  return {
    desktop: {
      display: "inline-block",
      padding: "14px 36px",
      backgroundColor: bg,
      color,
      fontWeight: "700",
      fontSize: "15px",
      borderRadius: "9999px",
      cursor: "pointer",
      marginTop: "24px",
      ...(fullWidth ? { width: "100%", textAlign: "center" } : {}),
    },
  };
}

function sectionWrap(bg, py = "80px", attrs = {}) {
  return {
    id: uid(), tag: "section",
    styles: { desktop: { backgroundColor: bg, paddingTop: py, paddingBottom: py, ...attrs }, mobile: { paddingTop: "48px", paddingBottom: "48px" } },
    children: [],
    attrs: {},
  };
}

function container(children = []) {
  return {
    id: uid(), tag: "div",
    styles: { desktop: { maxWidth: "1100px", margin: "0 auto", paddingLeft: "24px", paddingRight: "24px" } },
    children,
    attrs: {},
  };
}

function heading(text, tag = "h2", color = "#ffffff", size = "40px", align = "center") {
  return { id: uid(), tag, content: text, styles: headingStyles(color, size, align), children: [], attrs: {} };
}

function para(text, color = "rgba(255,255,255,0.7)", align = "center") {
  return { id: uid(), tag: "p", content: text, styles: bodyStyles(color, align), children: [], attrs: {} };
}

function btn(text, href = "#", bg = "#ffffff", color = "#000000") {
  return {
    id: uid(), tag: "a",
    content: text,
    attrs: { href },
    styles: btnStyles(bg, color),
    children: [],
  };
}

function card(children = [], bg = "#1a1a1a", radius = "16px") {
  return {
    id: uid(), tag: "div",
    styles: { desktop: { backgroundColor: bg, borderRadius: radius, padding: "32px" } },
    children,
    attrs: {},
  };
}

function grid(cols = 3, children = [], gap = "24px") {
  return {
    id: uid(), tag: "div",
    styles: {
      desktop: { display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap },
      mobile:  { gridTemplateColumns: "1fr" },
    },
    children,
    attrs: {},
  };
}

function centerBox(children = []) {
  return {
    id: uid(), tag: "div",
    styles: { desktop: { display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" } },
    children,
    attrs: {},
  };
}

// ── Block converters ──────────────────────────────────────────────────────────

function migrateHero(b) {
  const c = b.content || {};
  const s = b.styles  || {};
  const bg = s.sectionBg || "#0a0a0a";
  const hColor = s.headingColor || "#ffffff";
  const bColor = s.bodyColor || "rgba(255,255,255,0.7)";
  const accent = s.accentColor || "#ffffff";

  const children = [];
  if (c.heading) children.push(heading(String(c.heading), "h1", hColor, "56px"));
  if (c.subheading) children.push(para(String(c.subheading), bColor));
  if (c.cta || c.ctaText) children.push(btn(String(c.cta || c.ctaText), String(c.ctaLink || "#"), accent, bg === "#ffffff" ? "#000000" : "#ffffff"));

  const sec = sectionWrap(bg, "100px");
  sec.styles.desktop = {
    ...sec.styles.desktop,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "70vh",
    textAlign: "center",
  };
  sec.children = [container([centerBox(children)])];
  return sec;
}

function migrateAbout(b) {
  const c = b.content || {};
  const s = b.styles  || {};
  const bg = s.sectionBg || "#111111";
  const hColor = s.headingColor || "#ffffff";
  const bColor = s.bodyColor || "rgba(255,255,255,0.7)";

  const children = [];
  if (c.heading || c.title) children.push(heading(String(c.heading || c.title), "h2", hColor));
  if (c.body || c.description || c.subheading) children.push(para(String(c.body || c.description || c.subheading), bColor));

  const sec = sectionWrap(bg);
  sec.children = [container([centerBox(children)])];
  return sec;
}

function migrateServices(b) {
  const c = b.content || {};
  const s = b.styles  || {};
  const bg = s.sectionBg || "#0d0d0d";
  const cardBg = s.cardBg || "#1a1a1a";
  const hColor = s.headingColor || "#ffffff";
  const bColor = s.bodyColor || "rgba(255,255,255,0.65)";

  const services = (Array.isArray(c.services) ? c.services : []).slice(0, 6);
  const cards = services.map((svc) => {
    const items = [];
    if (svc.title || svc.name) items.push({ id: uid(), tag: "h3", content: String(svc.title || svc.name), styles: { desktop: { fontSize: "20px", fontWeight: "700", color: hColor, marginBottom: "8px" } }, children: [], attrs: {} });
    if (svc.description || svc.body) items.push({ id: uid(), tag: "p", content: String(svc.description || svc.body), styles: { desktop: { fontSize: "14px", color: bColor, lineHeight: "1.6" } }, children: [], attrs: {} });
    return card(items, cardBg);
  });

  const headerItems = [];
  if (c.heading || c.title) headerItems.push(heading(String(c.heading || c.title), "h2", hColor));
  if (c.subheading || c.description) headerItems.push(para(String(c.subheading || c.description), bColor));

  const colCount = cards.length <= 2 ? cards.length : 3;
  const sec = sectionWrap(bg);
  sec.children = [container([centerBox(headerItems), grid(colCount, cards)])];
  return sec;
}

function migrateFeatures(b) {
  const c = b.content || {};
  const s = b.styles  || {};
  const bg = s.sectionBg || "#111827";
  const cardBg = s.cardBg || "#1f2937";
  const hColor = s.headingColor || "#ffffff";
  const bColor = s.bodyColor || "rgba(255,255,255,0.65)";

  const items = (Array.isArray(c.features) ? c.features : []).slice(0, 6);
  const cards = items.map((f) => {
    const rows = [];
    if (f.title || f.name) rows.push({ id: uid(), tag: "h3", content: String(f.title || f.name), styles: { desktop: { fontSize: "18px", fontWeight: "700", color: hColor, marginBottom: "8px" } }, children: [], attrs: {} });
    if (f.description || f.body) rows.push({ id: uid(), tag: "p", content: String(f.description || f.body), styles: { desktop: { fontSize: "14px", color: bColor, lineHeight: "1.6" } }, children: [], attrs: {} });
    return card(rows, cardBg);
  });

  const headerItems = [];
  if (c.heading || c.title) headerItems.push(heading(String(c.heading || c.title), "h2", hColor));
  if (c.subheading || c.description) headerItems.push(para(String(c.subheading || c.description), bColor));

  const sec = sectionWrap(bg);
  sec.children = [container([centerBox(headerItems), grid(3, cards)])];
  return sec;
}

function migrateTestimonials(b) {
  const c = b.content || {};
  const s = b.styles  || {};
  const bg = s.sectionBg || "#0a0a0a";
  const cardBg = s.cardBg || "#161616";
  const hColor = s.headingColor || "#ffffff";
  const bColor = s.bodyColor || "rgba(255,255,255,0.7)";

  const items = (Array.isArray(c.testimonials) ? c.testimonials : []).slice(0, 3);
  const cards = items.map((t) => {
    const rows = [];
    if (t.quote || t.body) rows.push({ id: uid(), tag: "p", content: `"${t.quote || t.body}"`, styles: { desktop: { fontSize: "16px", color: bColor, lineHeight: "1.7", marginBottom: "16px", fontStyle: "italic" } }, children: [], attrs: {} });
    if (t.name || t.author) rows.push({ id: uid(), tag: "p", content: `— ${t.name || t.author}`, styles: { desktop: { fontSize: "13px", fontWeight: "700", color: hColor } }, children: [], attrs: {} });
    return card(rows, cardBg);
  });

  const headerItems = [];
  if (c.heading || c.title) headerItems.push(heading(String(c.heading || c.title), "h2", hColor));
  if (c.subheading) headerItems.push(para(String(c.subheading), bColor));

  const sec = sectionWrap(bg);
  sec.children = [container([centerBox(headerItems), grid(items.length || 3, cards)])];
  return sec;
}

function migrateTeam(b) {
  const c = b.content || {};
  const s = b.styles  || {};
  const bg = s.sectionBg || "#0d0d0d";
  const cardBg = s.cardBg || "#1a1a1a";
  const hColor = s.headingColor || "#ffffff";
  const bColor = s.bodyColor || "rgba(255,255,255,0.6)";

  const members = (Array.isArray(c.team) ? c.team : []).slice(0, 6);
  const cards = members.map((m) => {
    const rows = [];
    if (m.name) rows.push({ id: uid(), tag: "h3", content: String(m.name), styles: { desktop: { fontSize: "18px", fontWeight: "700", color: hColor, marginBottom: "4px" } }, children: [], attrs: {} });
    if (m.role || m.title) rows.push({ id: uid(), tag: "p", content: String(m.role || m.title), styles: { desktop: { fontSize: "13px", color: bColor } }, children: [], attrs: {} });
    return card(rows, cardBg);
  });

  const headerItems = [];
  if (c.heading || c.title) headerItems.push(heading(String(c.heading || c.title), "h2", hColor));
  if (c.subheading) headerItems.push(para(String(c.subheading), bColor));

  const sec = sectionWrap(bg);
  sec.children = [container([centerBox(headerItems), grid(3, cards)])];
  return sec;
}

function migratePricing(b) {
  const c = b.content || {};
  const s = b.styles  || {};
  const bg = s.sectionBg || "#0a0a0a";
  const cardBg = s.cardBg || "#161616";
  const hColor = s.headingColor || "#ffffff";
  const bColor = s.bodyColor || "rgba(255,255,255,0.65)";

  const tiers = (Array.isArray(c.tiers) ? c.tiers : []).slice(0, 4);
  const cards = tiers.map((t) => {
    const rows = [];
    if (t.name) rows.push({ id: uid(), tag: "h3", content: String(t.name), styles: { desktop: { fontSize: "20px", fontWeight: "700", color: hColor, marginBottom: "8px" } }, children: [], attrs: {} });
    if (t.price) rows.push({ id: uid(), tag: "p", content: String(t.price), styles: { desktop: { fontSize: "36px", fontWeight: "800", color: hColor, marginBottom: "8px" } }, children: [], attrs: {} });
    if (t.description) rows.push({ id: uid(), tag: "p", content: String(t.description), styles: { desktop: { fontSize: "14px", color: bColor, marginBottom: "16px" } }, children: [], attrs: {} });
    if (t.cta) rows.push(btn(String(t.cta), String(t.ctaLink || "#"), hColor, bg === "#ffffff" ? "#000000" : "#0a0a0a"));
    return card(rows, cardBg);
  });

  const headerItems = [];
  if (c.heading || c.title) headerItems.push(heading(String(c.heading || c.title), "h2", hColor));
  if (c.subheading || c.description) headerItems.push(para(String(c.subheading || c.description), bColor));

  const sec = sectionWrap(bg);
  sec.children = [container([centerBox(headerItems), grid(tiers.length || 3, cards)])];
  return sec;
}

function migrateFaq(b) {
  const c = b.content || {};
  const s = b.styles  || {};
  const bg = s.sectionBg || "#111111";
  const hColor = s.headingColor || "#ffffff";
  const bColor = s.bodyColor || "rgba(255,255,255,0.65)";

  const faqs = (Array.isArray(c.faqs) ? c.faqs : []).slice(0, 10);
  const faqNodes = faqs.map((f) => {
    const rows = [];
    if (f.question) rows.push({ id: uid(), tag: "h3", content: String(f.question), styles: { desktop: { fontSize: "17px", fontWeight: "700", color: hColor, marginBottom: "8px" } }, children: [], attrs: {} });
    if (f.answer) rows.push({ id: uid(), tag: "p", content: String(f.answer), styles: { desktop: { fontSize: "14px", color: bColor, lineHeight: "1.7" } }, children: [], attrs: {} });
    return {
      id: uid(), tag: "div",
      styles: { desktop: { padding: "24px 0", borderBottom: "1px solid rgba(255,255,255,0.1)" } },
      children: rows, attrs: {},
    };
  });

  const headerItems = [];
  if (c.heading || c.title) headerItems.push(heading(String(c.heading || c.title), "h2", hColor));
  if (c.subheading) headerItems.push(para(String(c.subheading), bColor));

  const sec = sectionWrap(bg);
  sec.children = [container([centerBox(headerItems), { id: uid(), tag: "div", styles: { desktop: { maxWidth: "720px", margin: "0 auto" } }, children: faqNodes, attrs: {} }])];
  return sec;
}

function migrateCta(b) {
  const c = b.content || {};
  const s = b.styles  || {};
  const bg = s.sectionBg || s.accentColor || "#6344d4";
  const hColor = s.headingColor || "#ffffff";
  const bColor = s.bodyColor || "rgba(255,255,255,0.85)";

  const children = [];
  if (c.heading || c.title) children.push(heading(String(c.heading || c.title), "h2", hColor));
  if (c.subheading || c.description) children.push(para(String(c.subheading || c.description), bColor));
  if (c.cta || c.ctaText) children.push(btn(String(c.cta || c.ctaText), String(c.ctaLink || "#"), "#ffffff", bg));

  const sec = sectionWrap(bg, "80px");
  sec.children = [container([centerBox(children)])];
  return sec;
}

function migrateContact(b) {
  const c = b.content || {};
  const s = b.styles  || {};
  const bg = s.sectionBg || "#111111";
  const hColor = s.headingColor || "#ffffff";
  const bColor = s.bodyColor || "rgba(255,255,255,0.65)";

  const children = [];
  if (c.heading || c.title) children.push(heading(String(c.heading || c.title), "h2", hColor));
  if (c.subheading || c.description) children.push(para(String(c.subheading || c.description), bColor));

  // Simple contact info block
  const info = [];
  if (c.email) info.push({ id: uid(), tag: "p", content: `Email: ${c.email}`, styles: { desktop: { color: bColor, fontSize: "15px", marginBottom: "8px" } }, children: [], attrs: {} });
  if (c.phone) info.push({ id: uid(), tag: "p", content: `Phone: ${c.phone}`, styles: { desktop: { color: bColor, fontSize: "15px", marginBottom: "8px" } }, children: [], attrs: {} });
  if (c.address) info.push({ id: uid(), tag: "p", content: String(c.address), styles: { desktop: { color: bColor, fontSize: "15px" } }, children: [], attrs: {} });
  if (info.length > 0) {
    children.push({ id: uid(), tag: "div", styles: { desktop: { marginTop: "24px" } }, children: info, attrs: {} });
  }

  const sec = sectionWrap(bg);
  sec.children = [container([centerBox(children)])];
  return sec;
}

function migrateHeader(b) {
  const c = b.content || {};
  const s = b.styles  || {};
  const bg = s.sectionBg || "#000000";

  const logoNode = { id: uid(), tag: "a", content: String(c.brand || c.logo || "Brand"), attrs: { href: "/" }, styles: { desktop: { fontSize: "22px", fontWeight: "800", color: "#ffffff", textDecoration: "none" } }, children: [] };

  const navItems = Array.isArray(c.links) ? c.links : [];
  const navList = {
    id: uid(), tag: "nav",
    styles: { desktop: { display: "flex", gap: "32px", alignItems: "center" } },
    children: navItems.map((item) => ({
      id: uid(), tag: "a",
      content: String(item.label || item.text || "Link"),
      attrs: { href: String(item.href || item.link || "#") },
      styles: { desktop: { color: "rgba(255,255,255,0.75)", fontSize: "14px", fontWeight: "500", textDecoration: "none" } },
      children: [],
    })),
    attrs: {},
  };

  const wrap = {
    id: uid(), tag: "header",
    styles: {
      desktop: { backgroundColor: bg, paddingTop: "16px", paddingBottom: "16px", position: "sticky", top: "0", zIndex: "100" },
    },
    children: [{
      id: uid(), tag: "div",
      styles: { desktop: { maxWidth: "1100px", margin: "0 auto", paddingLeft: "24px", paddingRight: "24px", display: "flex", alignItems: "center", justifyContent: "space-between" } },
      children: [logoNode, navList],
      attrs: {},
    }],
    attrs: {},
  };
  return wrap;
}

function migrateFooter(b) {
  const c = b.content || {};
  const s = b.styles  || {};
  const bg = s.sectionBg || "#000000";

  const children = [];
  if (c.brand || c.logo) {
    children.push({ id: uid(), tag: "p", content: String(c.brand || c.logo), styles: { desktop: { fontSize: "20px", fontWeight: "800", color: "#ffffff", marginBottom: "8px" } }, children: [], attrs: {} });
  }
  if (c.tagline || c.description) {
    children.push({ id: uid(), tag: "p", content: String(c.tagline || c.description), styles: { desktop: { fontSize: "14px", color: "rgba(255,255,255,0.5)", marginBottom: "16px" } }, children: [], attrs: {} });
  }
  if (c.copyright) {
    children.push({ id: uid(), tag: "p", content: String(c.copyright), styles: { desktop: { fontSize: "12px", color: "rgba(255,255,255,0.3)", marginTop: "24px" } }, children: [], attrs: {} });
  }

  const sec = sectionWrap(bg, "48px");
  sec.tag = "footer";
  sec.children = [container([centerBox(children)])];
  return sec;
}

function migrateStatement(b) {
  const c = b.content || {};
  const s = b.styles  || {};
  const bg = s.sectionBg || "#000000";
  const hColor = s.headingColor || "#ffffff";
  const bColor = s.bodyColor || "rgba(255,255,255,0.7)";

  const children = [];
  if (c.headline || c.heading || c.statement) {
    children.push({ id: uid(), tag: "h2", content: String(c.headline || c.heading || c.statement), styles: { desktop: { fontSize: "48px", fontWeight: "800", color: hColor, textAlign: "center", lineHeight: "1.1" }, mobile: { fontSize: "32px" } }, children: [], attrs: {} });
  }
  if (c.body || c.subheading) children.push(para(String(c.body || c.subheading), bColor));
  if (c.cta || c.ctaText) children.push(btn(String(c.cta || c.ctaText), String(c.ctaLink || "#"), "#ffffff", "#000000"));

  const sec = sectionWrap(bg, "100px");
  sec.children = [container([centerBox(children)])];
  return sec;
}

function migrateGallery(b) {
  const c = b.content || {};
  const s = b.styles  || {};
  const bg = s.sectionBg || "#0d0d0d";
  const hColor = s.headingColor || "#ffffff";
  const bColor = s.bodyColor || "rgba(255,255,255,0.6)";

  const images = (Array.isArray(c.images) ? c.images : []).slice(0, 9);
  const imgNodes = images.map((img) => ({
    id: uid(), tag: "img",
    attrs: { src: String(img.src || img.url || ""), alt: String(img.alt || img.caption || "") },
    styles: { desktop: { width: "100%", height: "220px", objectFit: "cover", borderRadius: "12px" } },
    children: [], content: undefined,
  }));

  const headerItems = [];
  if (c.heading || c.title) headerItems.push(heading(String(c.heading || c.title), "h2", hColor));
  if (c.subheading) headerItems.push(para(String(c.subheading), bColor));

  const sec = sectionWrap(bg);
  sec.children = [container([centerBox(headerItems), grid(3, imgNodes)])];
  return sec;
}

function migrateWhyUs(b) {
  const c = b.content || {};
  const s = b.styles  || {};
  const bg = s.sectionBg || "#111111";
  const cardBg = s.cardBg || "#1a1a1a";
  const hColor = s.headingColor || "#ffffff";
  const bColor = s.bodyColor || "rgba(255,255,255,0.65)";

  const items = (Array.isArray(c.reasons) ? c.reasons : Array.isArray(c.features) ? c.features : []).slice(0, 6);
  const cards = items.map((item) => {
    const rows = [];
    if (item.title || item.name) rows.push({ id: uid(), tag: "h3", content: String(item.title || item.name), styles: { desktop: { fontSize: "18px", fontWeight: "700", color: hColor, marginBottom: "8px" } }, children: [], attrs: {} });
    if (item.description || item.body) rows.push({ id: uid(), tag: "p", content: String(item.description || item.body), styles: { desktop: { fontSize: "14px", color: bColor, lineHeight: "1.6" } }, children: [], attrs: {} });
    return card(rows, cardBg);
  });

  const headerItems = [];
  if (c.heading || c.title) headerItems.push(heading(String(c.heading || c.title), "h2", hColor));
  if (c.subheading || c.description) headerItems.push(para(String(c.subheading || c.description), bColor));

  const sec = sectionWrap(bg);
  sec.children = [container([centerBox(headerItems), grid(3, cards)])];
  return sec;
}

// Canvas blocks (row/column layout) → flatten to a simple div
function migrateCanvas(b) {
  const bg = (b.styles || {}).sectionBg || "#ffffff";
  const sec = sectionWrap(bg);
  sec.children = [container([{ id: uid(), tag: "p", content: "(Custom section — please rebuild using the visual editor)", styles: { desktop: { color: "#999999", fontSize: "14px", textAlign: "center", padding: "40px" } }, children: [], attrs: {} }])];
  return sec;
}

// ── Main dispatcher ───────────────────────────────────────────────────────────

const CONVERTERS = {
  hero:         migrateHero,
  about:        migrateAbout,
  services:     migrateServices,
  features:     migrateFeatures,
  whyus:        migrateWhyUs,
  testimonials: migrateTestimonials,
  team:         migrateTeam,
  gallery:      migrateGallery,
  pricing:      migratePricing,
  faq:          migrateFaq,
  cta:          migrateCta,
  contact:      migrateContact,
  footer:       migrateFooter,
  statement:    migrateStatement,
  header:       migrateHeader,
  canvas:       migrateCanvas,
};

function migrateBlock(block) {
  const convert = CONVERTERS[block.type];
  if (convert) return convert(block);
  // Unknown block type — wrap in a placeholder div
  console.warn(`  ⚠  Unknown block type "${block.type}" — using placeholder`);
  const sec = sectionWrap("#f9fafb", "40px");
  sec.children = [container([{ id: uid(), tag: "p", content: `[${block.type} section]`, styles: { desktop: { color: "#999999", textAlign: "center", fontSize: "14px" } }, children: [], attrs: {} }])];
  return sec;
}

// ── Migration runner ──────────────────────────────────────────────────────────

async function run() {
  console.log(`\n🚀 Builder migration — ${DRY_RUN ? "DRY RUN (no writes)" : "LIVE"}\n`);

  await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME });
  console.log("✅ Connected to MongoDB\n");

  const projects = await BuilderProject.find({}).lean();
  console.log(`Found ${projects.length} project(s)\n`);

  let migrated = 0;
  let skipped  = 0;
  let errors   = 0;

  for (const project of projects) {
    const pages = project.pages || [];
    const alreadyMigrated = pages.every((p) => Array.isArray(p.elements) && p.elements.length > 0);

    if (alreadyMigrated) {
      console.log(`  ⏭  ${project.businessName || project.slug} — already migrated`);
      skipped++;
      continue;
    }

    try {
      const updatedPages = pages.map((page) => {
        const blocks = page.blocks || [];
        const elements = blocks.map(migrateBlock);
        return {
          ...page,
          elements,
          blocks_backup: blocks, // keep original blocks for rollback
        };
      });

      if (!DRY_RUN) {
        await BuilderProject.updateOne(
          { _id: project._id },
          {
            $set: {
              pages:   updatedPages,
              classes: [],
              tokens:  { colors: [], fonts: [], spacing: {} },
            },
          }
        );
      }

      const totalElements = updatedPages.reduce((sum, p) => sum + (p.elements || []).length, 0);
      console.log(`  ✓  ${project.businessName || project.slug} — ${pages.length} page(s), ${totalElements} root element(s) generated`);
      migrated++;
    } catch (err) {
      console.error(`  ✗  ${project.businessName || project.slug} — ERROR: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n── Summary ─────────────────────────────────`);
  console.log(`   Migrated : ${migrated}`);
  console.log(`   Skipped  : ${skipped}`);
  console.log(`   Errors   : ${errors}`);
  if (DRY_RUN) console.log(`\n⚠  DRY RUN — no data was written. Remove DRY_RUN=true to execute.`);
  console.log("");

  await mongoose.disconnect();
  process.exit(errors > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
