const mongoose = require("mongoose");

const pageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true },
    description: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Page", pageSchema);
