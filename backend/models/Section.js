const mongoose = require("mongoose");

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
    key:              { type: String, required: true, trim: true }, // component key, no longer globally unique
    page:             { type: String, required: true, trim: true }, // which page this instance belongs to
    title:            { type: String },
    shortDescription: { type: String },
    description:      { type: String },
    image:            { type: String },
    featuredImage:    { type: String },
    accordion:        [accordionItemSchema],
    button:           buttonSchema,
    order:            { type: Number, default: 0 },
  },
  { timestamps: true }
);

// A component key can only appear once per page
sectionSchema.index({ key: 1, page: 1 }, { unique: true });

module.exports = mongoose.model("Section", sectionSchema);
