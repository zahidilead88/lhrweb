const express = require("express");
const Menu = require("../models/Menu");

const router = express.Router();

// GET all navigation items (sorted by order)
router.get("/", async (req, res) => {
  const nav = await Menu.find().sort({ order: 1 });
  res.json(nav);
});

// POST new navigation item
router.post("/", async (req, res) => {
  const nav = new Menu(req.body);
  await nav.save();
  res.status(201).json(nav);
});

router.get("/:id", async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id);
    if (!menu) return res.status(404).json({ message: "Menu not found" });
    res.json(menu);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// PUT update a nav item
router.put("/:id", async (req, res) => {
  const updated = await Menu.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json(updated);
});

// DELETE nav item
router.delete("/:id", async (req, res) => {
  await Menu.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

// PUT reorder all items
router.put("/reorder/all", async (req, res) => {
  const { items } = req.body;

  try {
    for (const item of items) {
      await Menu.findByIdAndUpdate(item._id, {
        order: item.order,
        sublinks: item.sublinks || [],
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reorder" });
  }
});

module.exports = router;
