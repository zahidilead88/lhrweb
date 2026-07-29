const mongoose = require("mongoose");

// ── V1: legacy block schema (kept for rollback during migration) ──────────────
const blockSchema = new mongoose.Schema(
  {
    id:      { type: String, required: true },
    type:    { type: String, required: true },
    content: { type: mongoose.Schema.Types.Mixed, default: {} },
    styles:  { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

// ── V2: element node schema (recursive via Mixed children) ────────────────────
// Full validation of the recursive tree is done in application code / TypeScript.
// MongoDB stores children as Mixed to avoid schema recursion limits.
const elementSchema = new mongoose.Schema(
  {
    id:       { type: String, required: true },
    tag:      { type: String, required: true },
    className:{ type: String },
    content:  { type: String },
    attrs:    { type: mongoose.Schema.Types.Mixed, default: {} },
    styles:   { type: mongoose.Schema.Types.Mixed, default: { desktop: {} } },
    children: { type: mongoose.Schema.Types.Mixed, default: [] },
  },
  { _id: false }
);

// ── Saved section schema (from Figma canvas → Convert button) ────────────────
const savedSectionSchema = new mongoose.Schema(
  {
    id:            { type: String, required: true },
    name:          { type: String, required: true },
    html:          { type: String, default: "" },
    css:           { type: String, default: "" },
    thumbnail:     { type: String },        // base64 from html2canvas
    sourceFrameId: { type: String },        // which Frame produced this
    createdAt:     { type: String },
  },
  { _id: false }
);

// ── Named class schema (Phase 5) ──────────────────────────────────────────────
const styleClassSchema = new mongoose.Schema(
  {
    name:   { type: String, required: true },
    styles: { type: mongoose.Schema.Types.Mixed, default: { desktop: {} } },
  },
  { _id: false }
);

// ── Page schema — carries both V1 blocks and V2 elements during migration ─────
const pageSchema = new mongoose.Schema(
  {
    id:       { type: String, required: true },
    name:     { type: String, required: true },
    slug:     { type: String, required: true },
    // V1 — legacy; kept until migration is fully complete
    blocks:   { type: [blockSchema], default: [] },
    // V2 — new element tree
    elements: { type: [elementSchema], default: [] },
    // Round 5 Ch 5.2 — per-page SEO metadata (AI-generated or hand-written)
    seo: {
      title:       { type: String, maxlength: 80 },
      description: { type: String, maxlength: 220 },
      keywords:    { type: [String], default: undefined },
    },
  },
  { _id: false }
);

// ── Main project schema ───────────────────────────────────────────────────────
const builderProjectSchema = new mongoose.Schema(
  {
    userId:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status:       { type: String, enum: ["empty", "generating", "ready"], default: "empty" },
    prompt:       { type: String },
    businessName: { type: String },
    tagline:      { type: String },
    primaryColor:         { type: String, default: "#000000" },
    slug:                 { type: String, index: true },
    customDomain:         { type: String, sparse: true },
    customDomainVerified: { type: Boolean, default: false },
    customDomainToken:    { type: String },
    package:              { type: String, enum: ["starter", "pro"] },
    pages:                { type: [pageSchema], default: [] },
    generatedAt:          { type: Date },
    // Phase 4 — reusable components (Round 2 Ch 3: masters live at project level)
    components: {
      type: [
        new mongoose.Schema(
          {
            id:          { type: String, required: true },
            name:        { type: String, required: true },
            thumbnail:   { type: String },
            rootElement: { type: mongoose.Schema.Types.Mixed, required: true },
            createdAt:   { type: String },
            updatedAt:   { type: String },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    // V2 additions
    classes: { type: [styleClassSchema], default: [] },
    tokens:  {
      type: mongoose.Schema.Types.Mixed,
      default: { colors: [], fonts: [], spacing: {} },
    },
    // Round 5 Ch 4.3 — rewrite tone usage counts (feeds brandVoice learning)
    aiToneCounts: { type: mongoose.Schema.Types.Mixed, default: {} },
    // Round 5 Ch 4.3 — persistent AI memory (distilled facts, ~500 tokens max, user-editable)
    aiMemory: {
      businessSummary: { type: String, maxlength: 600 },
      brandVoice:      { type: String, maxlength: 200 },
      audience:        { type: String, maxlength: 200 },
      preferences:     { type: [String], default: [] },
      updatedAt:       { type: Date },
    },
    // Phase 8 — canvas mode
    canvasMode: { type: String, enum: ["flow", "free"], default: "flow" },
    // Figma canvas — saved sections (from Convert button)
    savedSections: { type: [savedSectionSchema], default: [] },
    // Figma canvas — viewport state (frames, zoom, pan)
    canvasState: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BuilderProject", builderProjectSchema);
