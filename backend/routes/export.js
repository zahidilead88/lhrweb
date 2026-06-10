const express        = require("express");
const router         = express.Router();
const { ZipArchive } = require("archiver");
const BuilderProject = require("../models/BuilderProject");
const { auth }       = require("../middleware/auth");
const { generateHtml }    = require("../generators/html");
const { generateNextjs }  = require("../generators/nextjs");
const { generateLaravel } = require("../generators/laravel");

// POST /api/export
router.post("/", auth, async (req, res) => {
  try {
    const { projectId, stack, database } = req.body;
    if (!projectId) return res.status(400).json({ message: "projectId required" });
    if (!["html", "nextjs", "laravel"].includes(stack))
      return res.status(400).json({ message: "stack must be html | nextjs | laravel" });

    const project = await BuilderProject.findOne({ _id: projectId, userId: req.user.userId });
    if (!project) return res.status(404).json({ message: "Project not found" });

    let files;
    if (stack === "html")    files = generateHtml(project);
    else if (stack === "nextjs") files = generateNextjs(project, database);
    else                     files = generateLaravel(project, database);

    const slug = (project.businessName || "website").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const zipName = `${slug}-${stack}.zip`;
    const folder  = `${slug}/`;

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${zipName}"`);

    const archive = new ZipArchive({ zlib: { level: 9 } });
    archive.on("error", (err) => { throw err; });
    archive.pipe(res);

    for (const [filepath, content] of Object.entries(files)) {
      archive.append(content, { name: folder + filepath });
    }

    await archive.finalize();
  } catch (err) {
    console.error("Export error:", err);
    if (!res.headersSent) res.status(500).json({ message: "Export failed" });
  }
});

module.exports = router;
