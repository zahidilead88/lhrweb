const express = require("express");
const router = express.Router();
const Project = require("../models/Project");
const upload = require("../middleware/upload");

// GET all projects (no upload middleware needed)
router.get("/", async (req, res) => {
  try {
    const projects = await Project.find().sort({ _id: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Not found" });
    res.json(project);
  } catch {
    res.status(500).json({ message: "Error getting slide" });
  }
});

// POST add new project with image
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { title, shortDescription, description, buttonText } = req.body;
    const image = req.file?.path;

    if (!title || !shortDescription || !image || !buttonText) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const project = await Project.create({
      title,
      shortDescription,
      description,
      image,
      buttonText,
    });

    res.status(201).json(project);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Failed to create project" });
  }
});

// PUT /api/projects/:id
const fs = require("fs");
const path = require("path");

router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { title, buttonText } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Not found" });

    // Delete old image if new one uploaded
    if (req.file && project.image) {
      const oldPath = path.join("public/uploads", path.basename(project.image));
      fs.existsSync(oldPath) && fs.unlinkSync(oldPath);
    }

    project.title = title;
    project.buttonText = buttonText;
    if (req.file) {
      project.image = `public/uploads/${req.file.filename}`;
    }

    await project.save();
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
});

// DELETE /api/projects/:id
router.delete("/:id", async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ message: "Not found" });

    // Delete image
    if (project.image) {
      const imagePath = path.join(
        "public/uploads",
        path.basename(project.image)
      );
      fs.existsSync(imagePath) && fs.unlinkSync(imagePath);
    }

    res.json({ message: "Slide deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});

module.exports = router;
