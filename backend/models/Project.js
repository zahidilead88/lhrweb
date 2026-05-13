const mongoose = require("mongoose");

const blockSchema = new mongoose.Schema({
  type: { type: String, enum: ['hero','intro','image-full','image-2col','video','pull-quote','carousel','media-grid','text-pattern'], required: true },
  heading: { type: String },
  subheading: { type: String },
  text: { type: String },
  images: { type: [String], default: [] },
  videoUrl: { type: String },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  order: { type: Number, default: 0 },
}, { _id: true });

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  image: { type: String, required: true },
  shortDescription: { type: String, required: true },
  description: { type: String },
  buttonText: { type: String, default: "Learn More" },
  tags: { type: [String], default: [] },
  videoUrl: { type: String },
  blocks: { type: [blockSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model("Project", projectSchema);
