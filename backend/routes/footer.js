const express = require("express");
const Footer = require("../models/Footer");
const router = express.Router();

const DEFAULT_FOOTER = {
  sitemapLinks: [
    { title: "Home", url: "/" },
    { title: "Work", url: "/projects" },
    { title: "Agency", url: "/about" },
    { title: "Services", url: "/services" },
    { title: "Journal", url: "/blog" },
    { title: "Tools", url: "/tools" },
    { title: "Start a Project", url: "/contact" },
  ],
  servicesLinks: [
    { title: "Brand Design", url: "/services#brand-design" },
    { title: "Illustration", url: "/services#illustration" },
    { title: "Web Design", url: "/services#web-design" },
    { title: "Product Design", url: "/services#product-design" },
    { title: "Print & Packaging", url: "/services#print-packaging" },
  ],
  socialLinks: [
    { title: "Twitter/X", url: "https://twitter.com/lhrweb" },
    { title: "Instagram", url: "https://instagram.com/lhrweb" },
    { title: "LinkedIn", url: "https://linkedin.com/company/lhrweb" },
    { title: "Dribbble", url: "https://dribbble.com/lhrweb" },
  ],
  phone: "+92 321 4516195",
  email: "zahid@lhrweb.com",
  address: "LHRWEB Digital\n1-C, Block 1, Johar Town\nLahore, Pakistan",
  companyName: "Made By LHRWEB Ltd 2025",
  craftingText: "Crafting since 2023",
  privacyPolicyUrl: "https://madebyshape.co.uk/privacy-policy/",
  copyrightText: "All Rights Reserved",
};

// GET footer settings (creates default if missing)
router.get("/", async (req, res) => {
  try {
    let footer = await Footer.findOne();
    if (!footer) {
      footer = await Footer.create(DEFAULT_FOOTER);
    }
    res.json(footer);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch footer settings" });
  }
});

// PUT update footer settings
router.put("/", async (req, res) => {
  try {
    const updated = await Footer.findOneAndUpdate({}, req.body, {
      new: true,
      upsert: true,
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update footer settings" });
  }
});

module.exports = router;
