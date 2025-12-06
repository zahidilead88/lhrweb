const mongoose = require("mongoose");

const buttonSchema = new mongoose.Schema(
  {
    label: { type: String },
    url: { type: String },
  },
  { _id: false }
);

const accordionItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    button: buttonSchema,
  },
  { _id: false }
);

const sectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    key: { type: String, required: true, trim: true, unique: true },
    title: { type: String }, // Optional, for legacy or display
    shortDescription: { type: String },
    description: { type: String },
    image: { type: String },
    featuredImage: { type: String },
    accordion: [accordionItemSchema],
    button: buttonSchema,
    pages: [{ type: String, trim: true }], // Array of page slugs where this section appears
  },
  { timestamps: true }
);

// Ensure at least one page is assigned to a section
sectionSchema.pre("save", function (next) {
  if (this.pages.length === 0) {
    const err = new Error("Section must be assigned to at least one page");
    return next(err);
  }
  next();
});

module.exports = mongoose.model("Section", sectionSchema);
