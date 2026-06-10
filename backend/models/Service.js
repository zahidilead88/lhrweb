const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema({
  name:     { type: String },
  price:    { type: String },
  period:   { type: String },
  tagline:  { type: String },
  features: { type: [String], default: [] },
  popular:  { type: Boolean, default: false },
}, { _id: false });

const processSchema = new mongoose.Schema({
  step:  { type: String },
  title: { type: String },
  body:  { type: String },
}, { _id: false });

const serviceSchema = new mongoose.Schema({
  slug:            { type: String, required: true, unique: true, trim: true },
  label:           { type: String },
  headline:        { type: String },
  description:     { type: String },
  longDescription: { type: String },
  image:           { type: String },
  capabilities:    { type: [String], default: [] },
  process:         { type: [processSchema], default: [] },
  packages:        { type: [packageSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model("Service", serviceSchema);
