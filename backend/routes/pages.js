const express = require("express");
const router = express.Router();
const Page = require("../models/Page");
const Section = require("../models/Section");
const Blog = require("../models/Blog");
const Project = require("../models/Project");

const SECTIONS_NEEDING_BLOGS    = new Set(["home-blog", "about-blog", "featured-blogs"]);
const SECTIONS_NEEDING_PROJECTS = new Set(["home-projects", "about-hero", "featured-projects"]);

// Get all pages
router.get("/", async (req, res) => {
  try {
    const pages = await Page.find().sort({ name: 1 });
    res.json(pages);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch pages" });
  }
});

// Get a single page by slug or ObjectId — embeds sections + any extra data sections need
router.get("/:slug", async (req, res) => {
  try {
    const ref = req.params.slug;
    const isId = /^[0-9a-fA-F]{24}$/.test(ref);
    const page = isId ? await Page.findById(ref) : await Page.findOne({ slug: ref });
    if (!page) return res.status(404).json({ message: "Page not found" });

    const slug = page.slug;
    const sections = await Section.find({ page: slug }).sort({ order: 1, name: 1 });
    const keys = new Set(sections.map(s => s.key));

    const needsBlogs    = slug === "blog"     || [...keys].some(k => SECTIONS_NEEDING_BLOGS.has(k));
    const needsProjects = slug === "projects" || [...keys].some(k => SECTIONS_NEEDING_PROJECTS.has(k));

    const [blogs, projects] = await Promise.all([
      needsBlogs    ? Blog.find().sort({ createdAt: -1 }).limit(50).lean()  : Promise.resolve(undefined),
      needsProjects ? Project.find().sort({ createdAt: -1 }).lean()          : Promise.resolve(undefined),
    ]);

    const response = { ...page.toObject(), sections };
    if (blogs)    response.blogs    = blogs;
    if (projects) response.projects = projects;

    res.json(response);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch page" });
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

// Update a page — cascades slug change to all sections
router.put("/:id", async (req, res) => {
  try {
    const { name, slug, description } = req.body;
    const existing = await Page.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Page not found" });

    const oldSlug = existing.slug;
    const page = await Page.findByIdAndUpdate(
      req.params.id,
      { name, slug, description },
      { new: true }
    );

    // Keep sections in sync when the slug changes
    if (slug && slug !== oldSlug) {
      await Section.updateMany({ page: oldSlug }, { $set: { page: slug } });
    }

    res.json(page);
  } catch (err) {
    if (err.code === 11000) {
      res.status(400).json({ message: "Slug must be unique" });
    } else {
      res.status(400).json({ message: "Failed to update page" });
    }
  }
});

// Save content sections (with nested blocks) for a page
router.put("/:id/sections", async (req, res) => {
  try {
    const { sections } = req.body;
    if (!Array.isArray(sections)) return res.status(400).json({ message: "sections must be an array" });
    const page = await Page.findById(req.params.id);
    if (!page) return res.status(404).json({ message: "Page not found" });
    page.contentSections = sections;
    await page.save();
    res.json(page);
  } catch (err) {
    res.status(500).json({ message: "Failed to save sections" });
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
