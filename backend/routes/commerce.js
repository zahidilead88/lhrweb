const express        = require("express");
const router         = express.Router();
const BuilderProject = require("../models/BuilderProject");
const Product        = require("../models/Product");
const Collection      = require("../models/Collection");
const { auth }        = require("../middleware/auth");

// Round 5 doc, Part 6 — catalog CRUD only (products, collections). Deliberately
// does NOT include cart/checkout/orders/Stripe webhooks — those involve real
// payment processing and money-handling decisions (currency, tax, idempotency)
// that need explicit product/business sign-off rather than being guessed here.
// See models/Cart.js and models/Order.js for the shapes that layer will use.

function toSlug(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }

// Confirms the requesting user owns the project a product/collection belongs to.
async function assertOwnsProject(projectId, userId) {
  const project = await BuilderProject.findOne({ _id: projectId, userId }).select("_id ecommerceEnabled").lean();
  return project;
}

// ── Products ───────────────────────────────────────────────────────────────

router.get("/products", auth, async (req, res) => {
  try {
    const { projectId } = req.query;
    if (!projectId) return res.status(400).json({ message: "projectId is required" });
    if (!(await assertOwnsProject(projectId, req.user.userId))) return res.status(404).json({ message: "Project not found" });
    const products = await Product.find({ projectId }).sort({ createdAt: -1 }).lean();
    res.json(products);
  } catch (err) {
    console.error("commerce products list error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/products", auth, async (req, res) => {
  try {
    const { projectId, name, price } = req.body;
    if (!projectId || !name || price == null) return res.status(400).json({ message: "projectId, name and price are required" });
    if (Number(price) < 0) return res.status(400).json({ message: "price must be non-negative" });
    if (!(await assertOwnsProject(projectId, req.user.userId))) return res.status(404).json({ message: "Project not found" });

    let slug = toSlug(name), i = 1;
    while (await Product.findOne({ projectId, slug }).select("_id").lean()) slug = `${toSlug(name)}-${i++}`;

    const product = await Product.create({
      projectId, name: String(name).slice(0, 200), slug,
      price: Number(price),
      description: String(req.body.description || "").slice(0, 20000),
      images: Array.isArray(req.body.images) ? req.body.images.slice(0, 20) : [],
      status: ["active", "draft", "archived"].includes(req.body.status) ? req.body.status : "draft",
    });
    res.status(201).json(product);
  } catch (err) {
    console.error("commerce product create error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/products/:id", auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (!(await assertOwnsProject(product.projectId, req.user.userId))) return res.status(403).json({ message: "Forbidden" });

    const editable = ["name", "description", "status", "images", "price", "compareAtPrice", "cost", "options", "variants", "inventory", "shipping", "collections", "tags", "vendor", "seo"];
    for (const key of editable) {
      if (req.body[key] !== undefined) product[key] = req.body[key];
    }
    if (product.price < 0) return res.status(400).json({ message: "price must be non-negative" });
    await product.save();
    res.json(product);
  } catch (err) {
    console.error("commerce product update error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/products/:id", auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).select("projectId").lean();
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (!(await assertOwnsProject(product.projectId, req.user.userId))) return res.status(403).json({ message: "Forbidden" });
    await Product.deleteOne({ _id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    console.error("commerce product delete error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ── Collections ────────────────────────────────────────────────────────────

router.get("/collections", auth, async (req, res) => {
  try {
    const { projectId } = req.query;
    if (!projectId) return res.status(400).json({ message: "projectId is required" });
    if (!(await assertOwnsProject(projectId, req.user.userId))) return res.status(404).json({ message: "Project not found" });
    const collections = await Collection.find({ projectId }).sort({ createdAt: -1 }).lean();
    res.json(collections);
  } catch (err) {
    console.error("commerce collections list error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/collections", auth, async (req, res) => {
  try {
    const { projectId, name } = req.body;
    if (!projectId || !name) return res.status(400).json({ message: "projectId and name are required" });
    if (!(await assertOwnsProject(projectId, req.user.userId))) return res.status(404).json({ message: "Project not found" });

    let slug = toSlug(name), i = 1;
    while (await Collection.findOne({ projectId, slug }).select("_id").lean()) slug = `${toSlug(name)}-${i++}`;

    const collection = await Collection.create({
      projectId, name: String(name).slice(0, 120), slug,
      type: req.body.type === "automatic" ? "automatic" : "manual",
      rules: req.body.type === "automatic" && Array.isArray(req.body.rules) ? req.body.rules.slice(0, 10) : [],
      productIds: Array.isArray(req.body.productIds) ? req.body.productIds.slice(0, 500) : [],
    });
    res.status(201).json(collection);
  } catch (err) {
    console.error("commerce collection create error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/collections/:id", auth, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id).select("projectId").lean();
    if (!collection) return res.status(404).json({ message: "Collection not found" });
    if (!(await assertOwnsProject(collection.projectId, req.user.userId))) return res.status(403).json({ message: "Forbidden" });
    await Collection.deleteOne({ _id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    console.error("commerce collection delete error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
