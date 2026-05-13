const express    = require("express");
const router     = express.Router();
const nodemailer = require("nodemailer");
const Lead       = require("../models/Lead");

// ── Mailer ────────────────────────────────────────────────────────────────────
function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendLeadEmail(lead) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("SMTP credentials not set — skipping email notification.");
    return;
  }
  const transporter = createTransporter();
  const serviceLabel = lead.service
    ? lead.service.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Not specified";

  await transporter.sendMail({
    from:    `"LHRWEB Leads" <${process.env.SMTP_USER}>`,
    to:      process.env.LEAD_NOTIFY_EMAIL || "lhrweb042@gmail.com",
    subject: `New Lead: ${lead.name} — ${serviceLabel}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
        <div style="background:#111;padding:24px 32px">
          <h1 style="color:#fff;margin:0;font-size:22px">New Lead Received</h1>
        </div>
        <div style="padding:32px;background:#fff">
          <table style="width:100%;border-collapse:collapse;font-size:15px">
            <tr><td style="padding:10px 0;color:#6b7280;width:120px">Name</td><td style="padding:10px 0;font-weight:600">${lead.name}</td></tr>
            <tr style="border-top:1px solid #f3f4f6"><td style="padding:10px 0;color:#6b7280">Email</td><td style="padding:10px 0"><a href="mailto:${lead.email}" style="color:#111">${lead.email}</a></td></tr>
            <tr style="border-top:1px solid #f3f4f6"><td style="padding:10px 0;color:#6b7280">Phone</td><td style="padding:10px 0">${lead.phone || "—"}</td></tr>
            <tr style="border-top:1px solid #f3f4f6"><td style="padding:10px 0;color:#6b7280">Service</td><td style="padding:10px 0">${serviceLabel}</td></tr>
            <tr style="border-top:1px solid #f3f4f6"><td style="padding:10px 0;color:#6b7280">Status</td><td style="padding:10px 0;text-transform:capitalize">${lead.status}</td></tr>
            <tr style="border-top:1px solid #f3f4f6"><td style="padding:10px 0;color:#6b7280">Submitted</td><td style="padding:10px 0">${new Date(lead.createdAt).toLocaleString("en-PK", { timeZone: "Asia/Karachi", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</td></tr>
            <tr style="border-top:1px solid #f3f4f6"><td style="padding:10px 0;color:#6b7280;vertical-align:top">Message</td><td style="padding:10px 0;white-space:pre-wrap">${lead.message}</td></tr>
          </table>
          <a href="mailto:${lead.email}" style="display:inline-block;margin-top:24px;padding:12px 28px;background:#111;color:#fff;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">Reply to ${lead.name}</a>
        </div>
        <div style="padding:16px 32px;background:#f9fafb;font-size:12px;color:#9ca3af">
          Submitted via LHRWEB contact form
        </div>
      </div>
    `,
  });
}

// ── POST /api/leads  (public — contact form submission) ───────────────────────
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, service, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: "Name, email and message are required." });
    }
    const lead = await Lead.create({ name, email, phone, service, message });

    // Fire-and-forget — don't block the response on email
    sendLeadEmail(lead).catch((err) => console.error("Email send failed:", err));

    res.status(201).json({ success: true, id: lead._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ── GET /api/leads  (admin) ───────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status && status !== "all" ? { status } : {};
    const [leads, total] = await Promise.all([
      Lead.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
      Lead.countDocuments(filter),
    ]);
    res.json({ leads, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── PUT /api/leads/:id  (admin — update status) ───────────────────────────────
router.put("/:id", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["new", "contacted", "closed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const lead = await Lead.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!lead) return res.status(404).json({ message: "Lead not found" });
    res.json(lead);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── DELETE /api/leads/:id  (admin) ───────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    await Lead.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
