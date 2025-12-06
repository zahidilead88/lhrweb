const express = require("express");
const router = express.Router();
const Section = require("../models/Section");
const upload = require("../middleware/upload");

// Get all sections, optionally filter by page
router.get("/", async (req, res) => {
  try {
    const { page } = req.query;
    const filter = page ? { pages: page } : {}; // Query for sections that include the specified page
    const sections = await Section.find(filter).sort({ name: 1 });
    res.json(sections);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch sections" });
  }
});

// Get a single section by id
router.get("/:id", async (req, res) => {
  try {
    const section = await Section.findById(req.params.id);
    if (!section) return res.status(404).json({ message: "Section not found" });
    res.json(section);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch section" });
  }
});

// Create a new section (with file upload)
router.post(
  "/",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "featuredImage", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        name,
        key,
        title,
        shortDescription,
        description,
        pages, // Changed from page to pages
        accordion,
        button,
      } = req.body;
      const image = req.files?.image?.[0]?.path;
      const featuredImage = req.files?.featuredImage?.[0]?.path;

      // Ensure pages is an array
      const pagesList = typeof pages === "string" ? [pages] : pages;

      const section = await Section.create({
        name,
        key,
        title,
        shortDescription,
        description,
        pages: pagesList, // Changed from page to pages
        image,
        featuredImage,
        accordion: accordion ? JSON.parse(accordion) : [],
        button: button ? JSON.parse(button) : undefined,
      });
      res.status(201).json(section);
    } catch (err) {
      res
        .status(400)
        .json({ message: "Failed to create section", error: err.message });
    }
  }
);

// Update a section (with file upload)
router.put(
  "/:id",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "featuredImage", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        name,
        key,
        title,
        shortDescription,
        description,
        pages, // Changed from page to pages
        accordion,
        button,
      } = req.body;
      const image = req.files?.image?.[0]?.path;
      const featuredImage = req.files?.featuredImage?.[0]?.path;

      // Ensure pages is an array
      const pagesList = typeof pages === "string" ? [pages] : pages;

      // Build update object
      const update = {
        name,
        key,
        title,
        shortDescription,
        description,
        pages: pagesList, // Changed from page to pages
        accordion: accordion ? JSON.parse(accordion) : [],
        button: button ? JSON.parse(button) : undefined,
      };
      if (image) update.image = image;
      if (featuredImage) update.featuredImage = featuredImage;

      const section = await Section.findByIdAndUpdate(req.params.id, update, {
        new: true,
      });
      if (!section)
        return res.status(404).json({ message: "Section not found" });
      res.json(section);
    } catch (err) {
      res
        .status(400)
        .json({ message: "Failed to update section", error: err.message });
    }
  }
);

// Add a page to a section
router.post("/:id/pages", async (req, res) => {
  try {
    const { page } = req.body;
    if (!page) {
      return res.status(400).json({ message: "Page slug is required" });
    }

    const section = await Section.findById(req.params.id);
    if (!section) {
      return res.status(404).json({ message: "Section not found" });
    }

    // Initialize pages array if it doesn't exist
    if (!section.pages) {
      section.pages = [];
    }

    // Add page if it's not already in the pages array
    if (!section.pages.includes(page)) {
      section.pages.push(page);
      await section.save();
    }

    res.json(section);
  } catch (err) {
    res
      .status(400)
      .json({ message: "Failed to add page to section", error: err.message });
  }
});

// Remove a page from a section
router.delete("/:id/pages/:page", async (req, res) => {
  try {
    const section = await Section.findById(req.params.id);
    if (!section) {
      return res.status(404).json({ message: "Section not found" });
    }

    // If pages array doesn't exist, there's nothing to do
    if (!section.pages) {
      return res.json(section);
    }

    // Remove the page from the pages array
    section.pages = section.pages.filter((p) => p !== req.params.page);

    // Only save if there's at least one page left
    if (section.pages.length === 0) {
      return res
        .status(400)
        .json({ message: "Cannot remove the last page from a section" });
    }

    await section.save();
    res.json(section);
  } catch (err) {
    res.status(400).json({
      message: "Failed to remove page from section",
      error: err.message,
    });
  }
});

// Delete a section
router.delete("/:id", async (req, res) => {
  try {
    const section = await Section.findByIdAndDelete(req.params.id);
    if (!section) return res.status(404).json({ message: "Section not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ message: "Failed to delete section" });
  }
});

module.exports = router;
