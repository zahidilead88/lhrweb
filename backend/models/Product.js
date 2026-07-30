const mongoose = require("mongoose");

// Round 5 doc, Part 6 — server-authoritative commerce. Clients never set prices
// directly at checkout time (that's the Cart/Order layer, still to build); this
// model is the catalog itself, owned entirely by the project's builder user.

const optionSchema = new mongoose.Schema(
  { name: { type: String, required: true }, values: { type: [String], default: [] } },
  { _id: false }
);

const variantSchema = new mongoose.Schema(
  {
    id:        { type: String, required: true },     // "var-xxxxxxxx"
    title:     { type: String, required: true },      // e.g. "Red / Large"
    price:     { type: Number, required: true, min: 0 },
    sku:       { type: String },
    inventory: { type: Number, default: 0 },
    options:   { type: Map, of: String, default: {} }, // { Color: "Red", Size: "Large" }
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    projectId:   { type: mongoose.Schema.Types.ObjectId, ref: "BuilderProject", required: true, index: true },
    name:        { type: String, required: true, trim: true, maxlength: 200 },
    slug:        { type: String, required: true },
    description: { type: String, default: "", maxlength: 20000 },
    status:      { type: String, enum: ["active", "draft", "archived"], default: "draft" },

    images: { type: [{ url: String, alt: String }], default: [] },

    price:          { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    cost:           { type: Number, min: 0 },   // private — margin calc only, never exposed publicly

    options:  { type: [optionSchema], default: [] },
    variants: { type: [variantSchema], default: [] },

    inventory: {
      track:     { type: Boolean, default: true },
      quantity:  { type: Number, default: 0 },
      lowStockAt:{ type: Number, default: 5 },
      policy:    { type: String, enum: ["deny", "continue", "hide"], default: "deny" }, // out-of-stock behavior
    },

    shipping: {
      weightGrams: { type: Number, default: 0 },
      dimensions:  { l: Number, w: Number, h: Number },
      digital:     { type: Boolean, default: false }, // no physical shipping needed
    },

    collections: { type: [mongoose.Schema.Types.ObjectId], ref: "Collection", default: [] },
    tags:        { type: [String], default: [] },
    vendor:      { type: String, default: "" },

    seo: {
      title:       { type: String, maxlength: 80 },
      description: { type: String, maxlength: 220 },
    },
  },
  { timestamps: true }
);

productSchema.index({ projectId: 1, slug: 1 }, { unique: true });

module.exports = mongoose.model("Product", productSchema);
