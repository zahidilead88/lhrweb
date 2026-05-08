const express = require("express");
const router = express.Router();
const Page = require("../models/Page");

// Get all pages
router.get("/", async (req, res) => {
  try {
    const pages = await Page.find().sort({ name: 1 });
    res.json(pages);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch pages" });
  }
});

// Create a new page
router.post("/", async (req, res) => {
  try {
    const { name, slug, description } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ message: "Name and slug are required" });
    }
    const page = await Page.create({ name, slug, description });
    res.status(201).json(page);
  } catch (err) {
    if (err.code === 11000) {
      res.status(400).json({ message: "Slug must be unique" });
    } else {
      res.status(400).json({ message: "Failed to create page" });
    }
  }
});

// Update a page
router.put("/:id", async (req, res) => {
  try {
    const { name, slug, description } = req.body;
    const page = await Page.findByIdAndUpdate(
      req.params.id,
      { name, slug, description },
      { new: true }
    );
    if (!page) return res.status(404).json({ message: "Page not found" });
    res.json(page);
  } catch (err) {
    if (err.code === 11000) {
      res.status(400).json({ message: "Slug must be unique" });
    } else {
      res.status(400).json({ message: "Failed to update page" });
    }
  }
});

// Delete a page
router.delete("/:id", async (req, res) => {
  try {
    const page = await Page.findByIdAndDelete(req.params.id);
    if (!page) return res.status(404).json({ message: "Page not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ message: "Failed to delete page" });
  }
});

module.exports = router;
