const express = require("express");
const router = express.Router();
const Blog = require("../models/Blog");
const upload = require("../middleware/upload");
const { auth, requireAdmin } = require("../middleware/auth");

// Create blog (admin)
router.post(
  "/",
  auth, requireAdmin,
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "fullImage", maxCount: 1 },
  ]),
  async (req, res) => {
    const { title, content, tags, featuredPages } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const thumbnail = req.files?.thumbnail?.[0]?.path;
    const fullImage = req.files?.fullImage?.[0]?.path;
    const processedTags = typeof tags === "string" ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
    const processedFeaturedPages = typeof featuredPages === "string" ? featuredPages.split(",").map((p) => p.trim()).filter(Boolean) : [];

    const blog = await Blog.create({
      title,
      content,
      thumbnail,
      fullImage,
      tags: processedTags,
      featuredPages: processedFeaturedPages,
    });

    res.status(201).json(blog);
  }
);

// Get all blogs (public)
router.get("/", async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.json(blogs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single blog by ID
router.get("/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });
    res.json(blog);
  } catch (err) {
    res.status(500).json({ message: "Error fetching blog" });
  }
});

// PUT /api/blogs/:id - Update blog
router.put("/:id", auth, requireAdmin, async (req, res) => {
  try {
    const { title, content, tags, featuredPages } = req.body;
    const processedTags = typeof tags === "string" ? tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined;
    
    let processedFeaturedPages = undefined;
    if (typeof featuredPages === "string") {
      processedFeaturedPages = featuredPages.split(",").map((p) => p.trim()).filter(Boolean);
    } else if (Array.isArray(featuredPages)) {
      processedFeaturedPages = featuredPages.map((p) => String(p).trim()).filter(Boolean);
    }

    const updated = await Blog.findByIdAndUpdate(
      req.params.id,
      { 
        title, 
        content, 
        ...(processedTags !== undefined && { tags: processedTags }),
        ...(processedFeaturedPages !== undefined && { featuredPages: processedFeaturedPages })
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/blogs/:id - Delete blog
router.delete("/:id", auth, requireAdmin, async (req, res) => {
  try {
    const deleted = await Blog.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.json({ message: "Blog deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/blogs/:id/comments
router.post("/:id/comments", async (req, res) => {
  const { comment } = req.body;

  if (!comment) return res.status(400).json({ message: "Comment is required" });

  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    blog.comments = blog.comments || [];
    blog.comments.push({ text: comment, createdAt: new Date() });

    await blog.save();
    res.status(201).json({ message: "Comment added" });
  } catch (err) {
    res.status(500).json({ message: "Failed to add comment" });
  }
});

// ✅ POST /api/blogs/:id/comments/:commentId/replies (Admin reply)
router.post("/:id/comments/:commentId/replies", async (req, res) => {
  const { reply } = req.body;

  if (!reply)
    return res.status(400).json({ message: "Reply text is required" });

  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    const comment = blog.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    comment.replies.push({
      text: reply,
      user: "Admin",
      createdAt: new Date(),
    });

    await blog.save();
    res.status(201).json({ message: "Reply added", blog });
  } catch (err) {
    res.status(500).json({ message: "Failed to add reply" });
  }
});

module.exports = router;
