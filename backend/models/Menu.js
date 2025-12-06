const mongoose = require("mongoose");

// const sublinkSchema = new mongoose.Schema({
//   title: String,
//   url: String,
// });

const menuSchema = new mongoose.Schema(
  {
    title: String,
    url: String,
    order: { type: Number, default: 0 },
    children: [this], // recursive schema for unlimited depth
  },
  { timestamps: true }
);

module.exports = mongoose.model("Menu", menuSchema);
