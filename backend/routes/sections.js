const express = require("express");
const router = express.Router();
const Section = require("../models/Section");
const upload = require("../middleware/upload");

// GET all sections, optionally filter by page
router.get("/", async (req, res) => {
  try {
    const { page } = req.query;
    const filter = page ? { page } : {};
    const sections = await Section.find(filter).sort({ order: 1, name: 1 });
    res.json(sections);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch sections" });
  }
});

// GET single section by id
router.get("/:id", async (req, res) => {
  try {
    const section = await Section.findById(req.params.id);
    if (!section) return res.status(404).json({ message: "Section not found" });
    res.json(section);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch section" });
  }
});

// POST create section
router.post(
  "/",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "featuredImage", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { name, key, page, title, shortDescription, description, accordion, button, order } = req.body;
      const image = req.files?.image?.[0]?.path;
      const featuredImage = req.files?.featuredImage?.[0]?.path;

      const section = await Section.create({
        name,
        key,
        page,
        title,
        shortDescription,
        description,
        image,
        featuredImage,
        accordion: accordion ? JSON.parse(accordion) : [],
        button: button ? JSON.parse(button) : undefined,
        order: order ? Number(order) : 0,
      });
      res.status(201).json(section);
    } catch (err) {
      res.status(400).json({ message: err.code === 11000
        ? "This section type already exists on that page. Edit the existing one instead."
        : "Failed to create section", error: err.message });
    }
  }
);

// PUT update section
router.put(
  "/:id",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "featuredImage", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { name, key, page, title, shortDescription, description, accordion, button, order } = req.body;
      const image = req.files?.image?.[0]?.path;
      const featuredImage = req.files?.featuredImage?.[0]?.path;

      const update = {
        name,
        key,
        page,
        title,
        shortDescription,
        description,
        accordion: accordion ? JSON.parse(accordion) : [],
        button: button ? JSON.parse(button) : undefined,
        order: order !== undefined ? Number(order) : 0,
      };
      if (image) update.image = image;
      if (featuredImage) update.featuredImage = featuredImage;

      const section = await Section.findByIdAndUpdate(req.params.id, update, { new: true });
      if (!section) return res.status(404).json({ message: "Section not found" });
      res.json(section);
    } catch (err) {
      res.status(400).json({ message: err.code === 11000
        ? "This section type already exists on that page."
        : "Failed to update section", error: err.message });
    }
  }
);

// DELETE section
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
