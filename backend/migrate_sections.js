const mongoose = require('mongoose');
const Section = require('./models/Section');
const Page = require('./models/Page');

const MONGO_URI = "mongodb+srv://lhrweb:123@lxrweb.yhnb3gc.mongodb.net/lhrweb";

async function migrate() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // 1. Add CTA to all pages except contact
    const pages = await Page.find({ slug: { $ne: 'contact' } });
    for (const page of pages) {
      const exists = await Section.findOne({ page: page.slug, key: 'cta' });
      if (!exists) {
        await Section.create({
          name: "Global CTA",
          key: "cta",
          page: page.slug,
          title: "Let's work together.",
          shortDescription: "Ready to get started?",
          button: { label: "Get Started", url: "/project-inquiry" },
          order: 999, // Keep at bottom
          enabled: true
        });
        console.log(`Added CTA to ${page.slug}`);
      }
    }

    // 2. Add Blog Listing to /blog page
    const blogPage = await Page.findOne({ slug: 'blog' });
    if (blogPage) {
      const exists = await Section.findOne({ page: 'blog', key: 'blog-listing' });
      if (!exists) {
        await Section.create({
          name: "Blog Listing",
          key: "blog-listing",
          page: "blog",
          order: 0,
          enabled: true
        });
        console.log("Added Blog Listing to /blog");
      }
    }

    // 3. Add Project Listing to /projects page
    const projectsPage = await Page.findOne({ slug: 'projects' });
    if (projectsPage) {
      const exists = await Section.findOne({ page: 'projects', key: 'projects-listing' });
      if (!exists) {
        await Section.create({
          name: "Projects Listing",
          key: "projects-listing",
          page: "projects",
          order: 0,
          enabled: true
        });
        console.log("Added Projects Listing to /projects");
      }
    }

    // 4. Add Contact Form to /contact page
    const contactPage = await Page.findOne({ slug: 'contact' });
    if (contactPage) {
      const exists = await Section.findOne({ page: 'contact', key: 'contact-form' });
      if (!exists) {
        await Section.create({
          name: "Contact Form",
          key: "contact-form",
          page: "contact",
          order: 0,
          enabled: true
        });
        console.log("Added Contact Form to /contact");
      }
    }

    console.log("Migration complete");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

migrate();
