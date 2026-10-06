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
    label:    { type: String },
    className:{ type: String },
    content:  { type: String },
    attrs:    { type: mongoose.Schema.Types.Mixed, default: {} },
    styles:   { type: mongoose.Schema.Types.Mixed, default: { desktop: {} } },
    children: { type: mongoose.Schema.Types.Mixed, default: [] },
    animation: { type: mongoose.Schema.Types.Mixed },
    layout:    { type: mongoose.Schema.Types.Mixed },
    locked:    { type: Boolean },
    hidden:    { type: Boolean },
    // Phase 2 (docs/BLUEPRINT.md) — binds this element to a CMS collection field
    cmsBinding: { type: mongoose.Schema.Types.Mixed },
    // Phase 3 — repeats this element's children once per matching CMS entry
    cmsList: { type: mongoose.Schema.Types.Mixed },
    // Phase 3 — binds this element to a product field ("Convert to Product Card")
    productBinding: { type: mongoose.Schema.Types.Mixed },
    // Phase 3 — repeats this element's children once per matching product
    productList: { type: mongoose.Schema.Types.Mixed },
    // Phase 3 — marks this element as a live "Add to Cart" button
    addToCart: { type: mongoose.Schema.Types.Mixed },
    // Phase 4 — links this element to a project component master, and which variant
    componentId: { type: String },
    variantId:   { type: String },
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
    // Phase 5 (docs/LHRWEB_MASTER_IMPLEMENTATION_PLAN.md §11.1) — page hierarchy
    parentId: { type: String },
    // V1 — legacy; kept until migration is fully complete
    blocks:   { type: [blockSchema], default: [] },
    // V2 — new element tree
    elements: { type: [elementSchema], default: [] },
    // Round 5 Ch 5.2 — per-page SEO metadata (AI-generated or hand-written)
    seo: {
      title:       { type: String, maxlength: 80 },
      description: { type: String, maxlength: 220 },
      keywords:    { type: [String], default: undefined },
      // Phase 1 (docs/BLUEPRINT.md) — OG image for social share cards
      ogImage:     { type: String, maxlength: 500 },
    },
    // Phase 3 — marks this page as a CMS template rendered at /<pathPrefix>/<entry-slug>
    cmsTemplate: {
      collectionId: { type: String },
      pathPrefix:   { type: String, maxlength: 80 },
    },
    // Phase 3 — marks this page as a product detail template at /<pathPrefix>/<product-slug>
    productTemplate: {
      pathPrefix: { type: String, maxlength: 80 },
    },
  },
  { _id: false }
);

// ── Main project schema ───────────────────────────────────────────────────────
const builderProjectSchema = new mongoose.Schema(
  {
    userId:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // Phase 8 (docs/LHRWEB_MASTER_IMPLEMENTATION_PLAN.md §14) — agency/white-label
    // tenancy. Set automatically when an agency owner/team member creates a
    // project; grants every owner/team member of that agency the same access
    // `userId` gives its direct owner (see backend/lib/projectAccess.js). A
    // client's own project keeps `userId` as their own account — no special
    // handling needed for that case, it works exactly like any independent
    // user's project always has.
    agencyId:     { type: mongoose.Schema.Types.ObjectId, ref: "Agency", default: null, index: true },
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
    // Part 6 — feature flags for the commerce/CMS layers
    ecommerceEnabled: { type: Boolean, default: false },
    cmsEnabled:       { type: Boolean, default: false },
    // Phase 3 (docs/LHRWEB_MASTER_IMPLEMENTATION_PLAN.md §9) — Stripe Connect,
    // one connected account per project so storefront payouts go directly to
    // the site owner (destination charges, platform takes an application fee).
    stripeConnectAccountId:      { type: String },
    stripeConnectOnboarded:      { type: Boolean, default: false },
    stripeConnectChargesEnabled: { type: Boolean, default: false },
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
            // Phase 4 — slot-marked child paths (comma-joined index paths, e.g.
            // "0,2"), preserved per-instance across an "Update Master" push.
            slotPaths: { type: [String], default: [] },
            // Phase 4 — named alternate root structures (e.g. Button: Primary/Secondary)
            variants: {
              type: [
                new mongoose.Schema(
                  {
                    id:          { type: String, required: true },
                    name:        { type: String, required: true },
                    rootElement: { type: mongoose.Schema.Types.Mixed, required: true },
                  },
                  { _id: false }
                ),
              ],
              default: [],
            },
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
    // Phase 5 §11.3 — global site navigation (multiple named menus, e.g. Header/Footer)
    menus: { type: mongoose.Schema.Types.Mixed, default: [] },
    // Phase 5 §11.5 — redirects
    redirects: { type: mongoose.Schema.Types.Mixed, default: [] },
    // Phase 5 §11.4 — custom 404: which page (by id) to render when nothing resolves
    notFoundPageId: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BuilderProject", builderProjectSchema);
