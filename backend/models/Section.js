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

const buttonSchema = new mongoose.Schema(
  { label: { type: String }, url: { type: String } },
  { _id: false }
);

const accordionItemSchema = new mongoose.Schema(
  {
    title:   { type: String, required: true },
    content: { type: String, required: true },
    button:  buttonSchema,
  },
  { _id: false }
);

const sectionSchema = new mongoose.Schema(
  {
    name:             { type: String, required: true, trim: true },
    key:              { type: String, trim: true, default: "" },
    page:             { type: String, required: true, trim: true },
    title:            { type: String },
    shortDescription: { type: String },
    description:      { type: String },
    image:            { type: String },
    featuredImage:    { type: String },
    accordion:        [accordionItemSchema],
    button:           buttonSchema,
    order:            { type: Number, default: 0 },
    enabled:          { type: Boolean, default: true },
    blocks:           { type: [blockSchema], default: [] },
  },
  { timestamps: true }
);

sectionSchema.index({ page: 1, order: 1 });

module.exports = mongoose.model("Section", sectionSchema);
