// Ch 5.1 — two-phase, job-based site generation.
// Phase 1: one small plan call. Phase 2: one call PER PAGE, concurrency 2, 1 retry each.
// Each successful page is written immediately (A5: resumable, partial success is a first-class outcome).

const crypto         = require("crypto");
const GenerationJob  = require("../../models/GenerationJob");
const BuilderProject = require("../../models/BuilderProject");
const { runAiOperation, AiError } = require("./index");
const { decrementQuota } = require("./quota");
const { starterTemplate, guessBusinessName } = require("./templates");

function uid() { return crypto.randomUUID(); }
function toSlug(name) { return (name || "site").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }

async function uniqueSlug(base, userId, projectId) {
  let slug = toSlug(base);
  let i = 1;
  while (await BuilderProject.findOne({ slug, userId, _id: { $ne: projectId } }).select("_id").lean()) {
    slug = `${toSlug(base)}-${i++}`;
  }
  return slug;
}

// tiny concurrency pool
async function pool(items, limit, worker) {
  const queue = items.map((item, i) => ({ item, i }));
  const runners = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length) {
      const { item, i } = queue.shift();
      await worker(item, i);
    }
  });
  await Promise.all(runners);
}

async function runSiteGenerationJob(jobId, input, user) {
  const job = await GenerationJob.findById(jobId);
  if (!job) return;
  const projectId = job.projectId;

  const fail = async (err) => {
    const code = err instanceof AiError ? err.code : null;
    await GenerationJob.findByIdAndUpdate(jobId, { phase: "failed", error: err.message, errorCode: code });
    await BuilderProject.findByIdAndUpdate(projectId, { status: "empty" }).catch(() => {});
    // job reserved 1 unit at start — refund on total failure
    await decrementQuota(job.userId, -1).catch(() => {});
  };

  // ── Phase 1 — plan ──────────────────────────────────────────────────────────
  let plan;
  try {
    const res = await runAiOperation("sitePlan", input, user);
    plan = res.data;
  } catch (err) {
    // Level 2 fallback (Ch 10.2): provider down → static starter template, zero AI
    if (err instanceof AiError && err.code === "AI_UNAVAILABLE") {
      try {
        const tpl = starterTemplate({
          businessName: guessBusinessName(input.prompt),
          theme: input.theme,
        });
        const slug = await uniqueSlug(tpl.businessName, job.userId, projectId);
        await BuilderProject.findByIdAndUpdate(projectId, {
          status: "ready",
          businessName: tpl.businessName,
          slug,
          tagline: tpl.tagline,
          primaryColor: tpl.primaryColor,
          pages: tpl.pages,
          generatedAt: new Date(),
        });
        await GenerationJob.findByIdAndUpdate(jobId, {
          phase: "done",
          usedTemplateFallback: true,
          pages: tpl.pages.map((p) => ({ name: p.name, slug: p.slug, status: "done", attempts: 0 })),
        });
        await decrementQuota(job.userId, -1).catch(() => {}); // template costs nothing
        return;
      } catch (tplErr) {
        return fail(tplErr);
      }
    }
    return fail(err);
  }

  // Write plan results — business identity + aiMemory.businessSummary (Ch 4.3, no extra call)
  const slug = await uniqueSlug(plan.businessName, job.userId, projectId);
  await BuilderProject.findByIdAndUpdate(projectId, {
    businessName: plan.businessName,
    slug,
    tagline: plan.tagline,
    primaryColor: plan.primaryColor,
    "aiMemory.businessSummary": plan.businessSummary,
    "aiMemory.updatedAt": new Date(),
  });
  await GenerationJob.findByIdAndUpdate(jobId, {
    phase: "pages",
    pages: plan.pages.map((p) => ({ name: p.name, slug: p.slug || toSlug(p.name), status: "pending", attempts: 0 })),
  });

  // ── Phase 2 — per-page generation, concurrency 2, 1 retry each ─────────────
  const results = new Array(plan.pages.length).fill(null);

  await pool(plan.pages, 2, async (page, idx) => {
    await GenerationJob.updateOne({ _id: jobId }, { $set: { [`pages.${idx}.status`]: "generating" } });

    let blocks = null;
    for (let attempt = 1; attempt <= 2 && !blocks; attempt++) {
      await GenerationJob.updateOne({ _id: jobId }, { $set: { [`pages.${idx}.attempts`]: attempt } });
      try {
        const res = await runAiOperation("sitePage", { plan, page, theme: input.theme }, user);
        blocks = res.data.blocks.map((b) => ({ ...b, id: `block-${uid()}` }));
      } catch (err) {
        if (err instanceof AiError && (err.code === "QUOTA_EXCEEDED")) attempt = 2; // don't retry quota
      }
    }

    const pageDoc = {
      id: `page-${uid()}`,
      name: page.name,
      slug: page.slug || toSlug(page.name),
      blocks: blocks || [],   // failed page → created EMPTY (partial success, Ch 5.1)
    };
    results[idx] = pageDoc;

    // write immediately — a crash after this point loses nothing (A5)
    await BuilderProject.updateOne({ _id: projectId }, { $push: { pages: pageDoc } });
    await GenerationJob.updateOne(
      { _id: jobId },
      { $set: { [`pages.${idx}.status`]: blocks ? "done" : "failed" } }
    );
  });

  // ── Finish — restore plan order, mark ready ─────────────────────────────────
  await BuilderProject.findByIdAndUpdate(projectId, {
    pages: results.filter(Boolean),
    status: "ready",
    generatedAt: new Date(),
  });
  await GenerationJob.findByIdAndUpdate(jobId, { phase: "done" });
}

module.exports = { runSiteGenerationJob };
