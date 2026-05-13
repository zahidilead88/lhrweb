const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    name:    { type: String, required: true, trim: true },
    email:   { type: String, required: true, trim: true, lowercase: true },
    phone:   { type: String, trim: true, default: "" },
    service: { type: String, trim: true, default: "" },
    message: { type: String, required: true },
    status:  { type: String, enum: ["new", "contacted", "closed"], default: "new" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Lead", leadSchema);
