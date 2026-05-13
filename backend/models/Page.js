const mongoose = require("mongoose");

const blockSchema = new mongoose.Schema({
  type:       { type: String, enum: ["hero","intro","image-full","image-2col","video","pull-quote","carousel","media-grid","text-pattern"], required: true },
  heading:    { type: String },
  subheading: { type: String },
  text:       { type: String },
  images:     { type: [String], default: [] },
  videoUrl:   { type: String },
  meta:       { type: mongoose.Schema.Types.Mixed, default: {} },
  enabled:    { type: Boolean, default: true },
  order:      { type: Number, default: 0 },
}, { _id: true });

const contentSectionSchema = new mongoose.Schema({
  name:    { type: String, default: "Section" },
  enabled: { type: Boolean, default: true },
  order:   { type: Number, default: 0 },
  blocks:  { type: [blockSchema], default: [] },
}, { _id: true });

const pageSchema = new mongoose.Schema(
  {
    name:            { type: String, required: true, trim: true },
    slug:            { type: String, required: true, trim: true, unique: true },
    description:     { type: String },
    seoTitle:        { type: String },
    seoDescription:  { type: String },
    keywords:        { type: String },
    ogTitle:         { type: String },
    ogDescription:   { type: String },
    ogImage:         { type: String },
    schema:          { type: String },
    robotsNoIndex:   { type: Boolean, default: false },
    contentSections: { type: [contentSectionSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Page", pageSchema);
