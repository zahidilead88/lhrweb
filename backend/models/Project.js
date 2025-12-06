const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  image: { type: String, required: true },
  shortDescription: { type: String, required: true },
  description: { type: String }, // ✅ New field
  buttonText: { type: String, default: "Learn More" },
});

module.exports = mongoose.model("Project", projectSchema);
