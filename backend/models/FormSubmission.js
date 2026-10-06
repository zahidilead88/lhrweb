const mongoose = require("mongoose");

// Phase 7 (docs/LHRWEB_MASTER_IMPLEMENTATION_PLAN.md §13) — form submissions
// from a published site's own forms (distinct from `Lead`, which is
// LHRWEB-the-company's own hardcoded marketing-site contact form and has no
// projectId at all). `data` is Mixed — a submission's field set is defined
// by whatever inputs the site owner put in their form, not a fixed schema.
const formSubmissionSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "BuilderProject", required: true, index: true },
    pageId:    { type: String, default: "" },
    formId:    { type: String, default: "" },
    data:      { type: mongoose.Schema.Types.Mixed, default: {} },
    read:      { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FormSubmission", formSubmissionSchema);
