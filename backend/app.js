const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use("/public/uploads", express.static("public/uploads"));

const adminAuthRoutes = require("./routes/auth");
app.use("/api/auth", adminAuthRoutes);

const authRoutes = require("./routes/adminAuth");
app.use("/api/admin/auth", authRoutes);

const menuRoutes = require("./routes/menu");
app.use("/api/menu", menuRoutes);

const protectedRoutes = require("./routes/protected");
app.use("/api", protectedRoutes);

const blogRoutes = require("./routes/blogs");
app.use("/api/blogs", blogRoutes);

const projectRoutes = require("./routes/projects");
app.use("/api/projects", projectRoutes);

const userRoutes = require("./routes/userRoutes");
app.use("/api/users", userRoutes);

const pageRoutes = require("./routes/pages");
app.use("/api/pages", pageRoutes);

const sectionRoutes = require("./routes/sections");
app.use("/api/sections", sectionRoutes);

const uploadRoute = require("./routes/upload");
app.use("/api/upload", uploadRoute);

const serviceRoutes = require("./routes/services");
app.use("/api/services", serviceRoutes);

const leadRoutes = require("./routes/leads");
app.use("/api/leads", leadRoutes);

// ── Normalise a stored page slug to a clean identifier ─────────────────────
// Old data used URL paths like "/", "/projects", "/secvices" as slugs.
// New data should use identifiers like "home", "projects", "services".
const SLUG_NORMALISE = {
  "/":         "home",
  "/home":     "home",
  "/projects": "projects",
  "/services": "services",
  "/secvices": "services",   // typo in original data
  "/about":    "about",
  "/contact":  "contact",
  "/blog":     "blog",
};

function normaliseSlug(raw) {
  if (!raw) return raw;
  return SLUG_NORMALISE[raw] || raw.replace(/^\//, "") || raw;
}

// Standard pages that should always exist in the pages collection
const STANDARD_PAGES = [
  { name: "Home",     slug: "home" },
  { name: "Services", slug: "services" },
  { name: "Projects", slug: "projects" },
  { name: "About",    slug: "about" },
  { name: "Contact",  slug: "contact" },
  { name: "Blog",     slug: "blog" },
];

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected");

    const db       = mongoose.connection;
    const sections = db.collection("sections");
    const pages    = db.collection("pages");

    // ── 1. Drop old unique indexes on sections ────────────────────────────
    for (const idxName of ["key_1", "key_1_page_1"]) {
      try {
        await sections.dropIndex(idxName);
        console.log(`Dropped old sections index: ${idxName}`);
      } catch (_) { /* already gone */ }
    }

    // ── 2. Fix page slugs in the pages collection ─────────────────────────
    const allPages = await pages.find({}).toArray();
    for (const p of allPages) {
      const fixed = normaliseSlug(p.slug);
      if (fixed !== p.slug) {
        await pages.updateOne({ _id: p._id }, { $set: { slug: fixed } });
        console.log(`Fixed page slug: "${p.slug}" → "${fixed}"`);
      }
      // Also normalise the name field (e.g. "home" → "Home")
      const niceName = fixed.charAt(0).toUpperCase() + fixed.slice(1);
      if (p.name !== niceName) {
        await pages.updateOne({ _id: p._id }, { $set: { name: niceName } });
      }
    }

    // ── 3. Ensure all standard pages exist ────────────────────────────────
    for (const sp of STANDARD_PAGES) {
      const exists = await pages.findOne({ slug: sp.slug });
      if (!exists) {
        await pages.insertOne({ name: sp.name, slug: sp.slug, description: "", createdAt: new Date(), updatedAt: new Date(), __v: 0 });
        console.log(`Created missing page: ${sp.slug}`);
      }
    }

    // ── 4. Ensure admin@lhrweb.com always exists with Admin@123 ────────
    const bcryptJs = require("bcryptjs");
    const users = db.collection("users");
    const hashed = await bcryptJs.hash("Admin@123", 10);
    
    const adminUser = await users.findOne({ email: "admin@lhrweb.com" });
    if (adminUser) {
      // Force update role and password to ensure default login works
      await users.updateOne(
        { email: "admin@lhrweb.com" }, 
        { $set: { role: "admin", password: hashed } }
      );
      console.log("Verified admin@lhrweb.com: Role and Password synced.");
    } else {
      await users.insertOne({
        name: "Admin",
        email: "admin@lhrweb.com",
        password: hashed,
        role: "admin",
        permissions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0,
      });
      console.log("Created default admin account: admin@lhrweb.com / Admin@123");
    }

    // ── 5. Seed demo service pages ────────────────────────────────────────
    const services = db.collection("services");
    const DEMO_SERVICES = [
      {
        slug: "web-design",
        label: "Web Design",
        headline: "Websites that leave\na lasting impression.",
        description: "We design stunning, user-focused websites that don't just look great — they drive real results for your business.",
        longDescription: "From sleek marketing sites to complex platforms, we build websites that reflect your brand, speak to your audience, and convert visitors into customers. Every pixel is intentional — we don't do templates.",
        capabilities: ["Custom UI Design", "Mobile Responsive", "CMS Integration", "Speed Optimised", "Brand Aligned", "SEO Ready"],
        process: [
          { step: "01", title: "Discovery",   body: "We dig into your business, goals, and audience. A proper brief means better results." },
          { step: "02", title: "Design",      body: "Wireframes, mockups, and brand-aligned visuals — refined until they're exactly right." },
          { step: "03", title: "Build",       body: "Clean, performant code. CMS integration. Cross-browser and device testing." },
          { step: "04", title: "Launch",      body: "QA, deployment, and a smooth handover. We don't disappear after go-live." },
        ],
        packages: [
          { name: "Starter",      price: "$499",   period: "one-time", tagline: "Perfect for small businesses just launching.",          features: ["5-page website", "Mobile responsive", "Basic SEO setup", "Contact form", "1 revision round", "2-week delivery"],                                                                                  popular: false },
          { name: "Professional", price: "$1,299", period: "one-time", tagline: "For growing businesses that need more.",                 features: ["Up to 15 pages", "Custom animations", "CMS integration", "Advanced SEO", "Google Analytics", "3 revision rounds", "4-week delivery", "1 month support"],                         popular: true  },
          { name: "Enterprise",   price: "Custom", period: "one-time", tagline: "Tailored for complex, large-scale projects.",            features: ["Unlimited pages", "Custom functionality", "Third-party integrations", "Performance optimisation", "Dedicated project manager", "Unlimited revisions", "Priority support"],         popular: false },
        ],
      },
      {
        slug: "web-development",
        label: "Web Development",
        headline: "A web development\nagency built to perform.",
        description: "Any brand knows that a website is their most important marketing tool. It can deliver rich content to a wide audience in a short period of time.",
        longDescription: "Whether you are a startup or a well-established brand, we place thought into every stage of a website — from research and planning to design and development right through to user and browser testing, making sure your website is on brand and achieves your goals.",
        capabilities: ["Web Design", "eCommerce", "UX Design", "Responsive Design", "Wireframes", "Strategy"],
        process: [
          { step: "01", title: "Discovery",    body: "Understanding your business, audience, and technical requirements before a single line of code is written." },
          { step: "02", title: "Architecture", body: "Planning the tech stack, database schema, and system design to ensure it scales with your business." },
          { step: "03", title: "Development",  body: "Agile sprints with regular check-ins. Clean, documented code that your team can maintain." },
          { step: "04", title: "Launch",       body: "Rigorous testing, performance tuning, and a smooth go-live with post-launch monitoring." },
        ],
        packages: [
          { name: "Basic",      price: "$999",   period: "one-time", tagline: "Get online fast with a solid foundation.",         features: ["Up to 5 pages", "Custom development", "Mobile first", "Basic CMS", "2-week delivery"],                                                                                        popular: false },
          { name: "Growth",     price: "$2,999", period: "one-time", tagline: "A full-featured site built to convert.",           features: ["Up to 20 pages", "Custom functionality", "CMS integration", "API integrations", "Performance optimised", "4-week delivery", "2 months support"],                         popular: true  },
          { name: "Enterprise", price: "Custom", period: "one-time", tagline: "Complex platforms, delivered end to end.",         features: ["Unlimited scope", "Microservices architecture", "Third-party integrations", "Dedicated team", "Ongoing retainer", "SLA guarantee", "24/7 priority support"],              popular: false },
        ],
      },
    ];
    for (const svc of DEMO_SERVICES) {
      const exists = await services.findOne({ slug: svc.slug });
      if (!exists) {
        await services.insertOne({ ...svc, createdAt: new Date(), updatedAt: new Date(), __v: 0 });
        console.log(`Seeded service: ${svc.slug}`);
      }
    }

    // ── 6. Migrate sections: pages[] → page, and normalise page slug ──────
    const allSections = await sections.find({}).toArray();
    for (const s of allSections) {
      const updates = {};

      // Migrate old pages[] array
      if (!s.page && Array.isArray(s.pages) && s.pages.length > 0) {
        updates.page  = normaliseSlug(s.pages[0]);
        updates.pages = undefined;
      }

      // Normalise page slug if it looks like a URL path
      const currentPage = updates.page || s.page;
      if (currentPage) {
        const normalised = normaliseSlug(currentPage);
        if (normalised !== currentPage) updates.page = normalised;
      }

      if (Object.keys(updates).length) {
        const setFields   = {};
        const unsetFields = {};
        for (const [k, v] of Object.entries(updates)) {
          if (v === undefined) unsetFields[k] = "";
          else setFields[k] = v;
        }
        const op = {};
        if (Object.keys(setFields).length)   op.$set   = setFields;
        if (Object.keys(unsetFields).length) op.$unset = unsetFields;
        await sections.updateOne({ _id: s._id }, op);
        console.log(`Fixed section "${s.name}": page → "${updates.page || s.page}"`);
      }
    }

  })
  .catch((err) => console.error(err));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
