const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  thumbnail: { type: String }, // ✅ Thumbnail image
  fullImage: { type: String }, // ✅ Full-size image
  createdAt: {
    type: Date,
    default: Date.now,
  },
  comments: [
    {
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
      replies: [
        {
          text: { type: String, required: true },
          user: { type: String, default: "Admin" }, // ✅ Defaults to Admin
          createdAt: { type: Date, default: Date.now },
        },
      ],
    },
  ],
});

module.exports = mongoose.model("Blog", blogSchema);
