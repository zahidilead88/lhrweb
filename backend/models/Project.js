const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  image: { type: String, required: true },
  shortDescription: { type: String, required: true },
  description: { type: String },
  buttonText: { type: String, default: "Learn More" },
  tags: { type: [String], default: [] },
  videoUrl: { type: String },
});

module.exports = mongoose.model("Project", projectSchema);
