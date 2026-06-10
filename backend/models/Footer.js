const mongoose = require("mongoose");

const footerLinkSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
});

const footerSchema = new mongoose.Schema(
  {
    sitemapLinks: { type: [footerLinkSchema], default: [] },
    servicesLinks: { type: [footerLinkSchema], default: [] },
    socialLinks: { type: [footerLinkSchema], default: [] },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    address: { type: String, default: "" },
    companyName: { type: String, default: "" },
    craftingText: { type: String, default: "" },
    privacyPolicyUrl: { type: String, default: "" },
    copyrightText: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Footer", footerSchema);
