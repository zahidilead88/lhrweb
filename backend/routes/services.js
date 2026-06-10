const express = require("express");
const router  = express.Router();
const Service = require("../models/Service");
const { auth, requireAdmin } = require("../middleware/auth");
const upload  = require("../middleware/upload");

function parseBody(body) {
  const d = { ...body };
  if (typeof d.capabilities === "string") try { d.capabilities = JSON.parse(d.capabilities); } catch { d.capabilities = []; }
  if (typeof d.process     === "string") try { d.process     = JSON.parse(d.process);     } catch { d.process = []; }
  if (typeof d.packages    === "string") try { d.packages    = JSON.parse(d.packages);    } catch { d.packages = []; }
  return d;
}

router.get("/", async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: 1 });
    res.json(services);
  } catch {
    res.status(500).json({ message: "Failed to fetch services" });
  }
});

router.get("/:ref", async (req, res) => {
  try {
    const { ref } = req.params;
    const service = ref.match(/^[0-9a-fA-F]{24}$/)
      ? await Service.findById(ref)
      : await Service.findOne({ slug: ref });
    if (!service) return res.status(404).json({ message: "Not found" });
    const others = await Service.find({ _id: { $ne: service._id } }, "slug label description").sort({ createdAt: 1 });
    res.json({ ...service.toObject(), others });
  } catch {
    res.status(500).json({ message: "Failed to fetch service" });
  }
});

router.post("/", auth, requireAdmin, upload.single("image"), async (req, res) => {
  try {
    const data = parseBody(req.body);
    if (req.file) data.image = req.file.filename;
    const service = await Service.create(data);
    res.status(201).json(service);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: "Slug already exists" });
    res.status(400).json({ message: "Failed to create service" });
  }
});

router.put("/:id", auth, requireAdmin, upload.single("image"), async (req, res) => {
  try {
    const data = parseBody(req.body);
    if (req.file) data.image = req.file.filename;
    const service = await Service.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!service) return res.status(404).json({ message: "Not found" });
    res.json(service);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: "Slug already exists" });
    res.status(400).json({ message: "Failed to update service" });
  }
});

router.delete("/:id", auth, requireAdmin, async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ message: "Not found" });
    res.json({ success: true });
  } catch {
    res.status(400).json({ message: "Failed to delete service" });
  }
});

module.exports = router;
