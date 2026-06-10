// ── HTML / CSS / JS Generator ─────────────────────────────────────────────────

function esc(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function blockToSection(block, pc) {
  const c = block.content || {};
  switch (block.type) {
    case "hero":
    case "banner":
      return `
    <section class="hero" id="hero">
      <div class="hero-inner">
        <h1>${esc(c.headline || c.heading || "Welcome")}</h1>
        <p>${esc(c.subheadline || c.subheading || "")}</p>
        ${(c.ctaText || c.cta) ? `<a href="${esc(c.ctaLink || "#contact")}" class="btn-primary">${esc(c.ctaText || c.cta)}</a>` : ""}
      </div>
    </section>`;

    case "about":
      return `
    <section class="section about" id="about">
      <div class="container">
        <h2>${esc(c.title || "About Us")}</h2>
        <p class="lead">${esc(c.body || "")}</p>
        ${(c.highlights || []).length ? `<ul class="highlights">${c.highlights.map(h => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
      </div>
    </section>`;

    case "services":
      return `
    <section class="section services" id="services">
      <div class="container">
        <div class="section-header">
          <h2>${esc(c.title || "Services")}</h2>
          <p>${esc(c.subtitle || "")}</p>
        </div>
        <div class="grid grid-3">
          ${(c.items || []).map(item => `
          <div class="card">
            <h3>${esc(item.title)}</h3>
            <p>${esc(item.description)}</p>
          </div>`).join("")}
        </div>
      </div>
    </section>`;

    case "features":
      return `
    <section class="section features" id="features">
      <div class="container">
        <div class="section-header">
          <h2>${esc(c.title || "Features")}</h2>
          <p>${esc(c.subtitle || "")}</p>
        </div>
        <div class="grid grid-3">
          ${(c.items || []).map(item => `
          <div class="feature-item">
            <h3>${esc(item.title)}</h3>
            <p>${esc(item.description)}</p>
          </div>`).join("")}
        </div>
      </div>
    </section>`;

    case "testimonials":
      return `
    <section class="section testimonials" id="testimonials">
      <div class="container">
        <h2>${esc(c.title || "Testimonials")}</h2>
        <div class="grid grid-3">
          ${(c.items || []).map(t => `
          <div class="testimonial-card">
            <p class="quote">"${esc(t.quote)}"</p>
            <div class="author">
              <strong>${esc(t.name)}</strong>
              <span>${esc(t.role)}${t.company ? ` · ${esc(t.company)}` : ""}</span>
            </div>
          </div>`).join("")}
        </div>
      </div>
    </section>`;

    case "faq":
      return `
    <section class="section faq" id="faq">
      <div class="container narrow">
        <h2>${esc(c.title || "FAQ")}</h2>
        <div class="faq-list">
          ${(c.items || []).map((item, i) => `
          <div class="faq-item">
            <button class="faq-q" onclick="toggleFaq(${i})">${esc(item.question)}<span class="faq-icon">+</span></button>
            <div class="faq-a" id="faq-${i}">${esc(item.answer)}</div>
          </div>`).join("")}
        </div>
      </div>
    </section>`;

    case "team":
      return `
    <section class="section team" id="team">
      <div class="container">
        <div class="section-header">
          <h2>${esc(c.title || "Our Team")}</h2>
          <p>${esc(c.subtitle || "")}</p>
        </div>
        <div class="grid grid-4">
          ${(c.items || []).map(m => `
          <div class="team-card">
            <div class="team-avatar">${esc(m.name?.[0] || "?")}</div>
            <h3>${esc(m.name)}</h3>
            <p class="role">${esc(m.role)}</p>
            <p class="bio">${esc(m.bio)}</p>
          </div>`).join("")}
        </div>
      </div>
    </section>`;

    case "pricing":
      return `
    <section class="section pricing" id="pricing">
      <div class="container">
        <div class="section-header">
          <h2>${esc(c.title || "Pricing")}</h2>
          <p>${esc(c.subtitle || "")}</p>
        </div>
        <div class="grid grid-3">
          ${(c.tiers || []).map(tier => `
          <div class="pricing-card${tier.popular ? " popular" : ""}">
            ${tier.popular ? `<span class="badge">Most Popular</span>` : ""}
            <h3>${esc(tier.name)}</h3>
            <div class="price"><span class="amount">${esc(tier.price)}</span><span class="period"> / ${esc(tier.period)}</span></div>
            <ul class="features-list">
              ${(tier.features || []).map(f => `<li>${esc(f)}</li>`).join("")}
            </ul>
            <a href="#contact" class="btn-plan${tier.popular ? " btn-primary" : ""}">Get Started</a>
          </div>`).join("")}
        </div>
      </div>
    </section>`;

    case "cta":
      return `
    <section class="section cta-section" id="cta">
      <div class="container text-center">
        <h2>${esc(c.headline || c.heading || "Ready to get started?")}</h2>
        <p>${esc(c.subtext || c.subheading || "")}</p>
        ${(c.buttonText || c.cta) ? `<a href="${esc(c.buttonLink || c.ctaLink || "#contact")}" class="btn-primary">${esc(c.buttonText || c.cta)}</a>` : ""}
      </div>
    </section>`;

    case "contact":
      return `
    <section class="section contact" id="contact">
      <div class="container">
        <div class="section-header">
          <h2>${esc(c.title || "Contact Us")}</h2>
          <p>${esc(c.subtitle || "")}</p>
        </div>
        <div class="contact-grid">
          <div class="contact-info">
            ${c.email ? `<p><strong>Email:</strong> <a href="mailto:${esc(c.email)}">${esc(c.email)}</a></p>` : ""}
            ${c.phone ? `<p><strong>Phone:</strong> <a href="tel:${esc(c.phone)}">${esc(c.phone)}</a></p>` : ""}
            ${c.address ? `<p><strong>Address:</strong> ${esc(c.address)}</p>` : ""}
          </div>
          <form class="contact-form" onsubmit="handleContact(event)">
            <input type="text" name="name" placeholder="Your Name" required />
            <input type="email" name="email" placeholder="Your Email" required />
            <textarea name="message" rows="5" placeholder="Your Message" required></textarea>
            <button type="submit" class="btn-primary">Send Message</button>
            <p class="form-note" id="form-note"></p>
          </form>
        </div>
      </div>
    </section>`;

    default:
      return "";
  }
}

function buildNav(pages, businessName) {
  const links = pages.map(p => `<a href="${p.slug === "home" ? "index.html" : `${p.slug}.html`}">${esc(p.name)}</a>`).join("\n        ");
  return `<nav class="navbar" id="navbar">
      <div class="nav-inner">
        <a href="index.html" class="nav-brand">${esc(businessName)}</a>
        <button class="nav-toggle" onclick="toggleNav()">☰</button>
        <div class="nav-links" id="nav-links">
          ${links}
        </div>
      </div>
    </nav>`;
}

function buildPage(pageName, sectionsHtml, navHtml, businessName, pc, isHome) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(pageName)} | ${esc(businessName)}</title>
  <link rel="stylesheet" href="${isHome ? "" : "../"}assets/style.css" />
</head>
<body>
    ${navHtml}
    <main>
      ${sectionsHtml || '<section class="section"><div class="container"><h2>Coming Soon</h2></div></section>'}
    </main>
    <footer class="footer">
      <div class="container">
        <p>&copy; ${new Date().getFullYear()} ${esc(businessName)}. All rights reserved.</p>
      </div>
    </footer>
    <script src="${isHome ? "" : "../"}assets/main.js"></script>
</body>
</html>`;
}

function buildCss(pc) {
  return `/* ── Reset & Base ─────────────────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111; background: #fff; line-height: 1.6; }
a { color: inherit; text-decoration: none; }
img { max-width: 100%; display: block; }

/* ── Variables ────────────────────────────────────────────────────────────── */
:root {
  --primary: ${pc};
  --primary-light: ${pc}22;
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-600: #4b5563;
  --radius: 12px;
  --shadow: 0 4px 24px rgba(0,0,0,.08);
}

/* ── Utility ──────────────────────────────────────────────────────────────── */
.container   { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
.narrow      { max-width: 760px; }
.text-center { text-align: center; }
.lead        { font-size: 1.2rem; color: var(--gray-600); }
.section     { padding: 96px 0; }
.section-header { text-align: center; margin-bottom: 64px; }
.section-header h2 { font-size: 2.5rem; font-weight: 800; margin-bottom: 12px; }
.section-header p  { font-size: 1.15rem; color: var(--gray-600); }

/* ── Grid ─────────────────────────────────────────────────────────────────── */
.grid { display: grid; gap: 28px; }
.grid-2 { grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
.grid-3 { grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
.grid-4 { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }

/* ── Buttons ──────────────────────────────────────────────────────────────── */
.btn-primary {
  display: inline-block;
  padding: 14px 36px;
  background: var(--primary);
  color: #fff;
  border-radius: 50px;
  font-weight: 700;
  font-size: 1rem;
  transition: transform .2s, box-shadow .2s;
  border: none; cursor: pointer;
}
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 30px var(--primary-light); }
.btn-plan {
  display: block; margin-top: 24px;
  padding: 12px 24px; border-radius: 8px;
  border: 2px solid var(--primary); color: var(--primary);
  font-weight: 600; text-align: center; transition: .2s;
}
.btn-plan:hover { background: var(--primary); color: #fff; }
.btn-plan.btn-primary { border-color: var(--primary); }

/* ── Navbar ───────────────────────────────────────────────────────────────── */
.navbar { position: sticky; top: 0; z-index: 100; background: rgba(255,255,255,.95); backdrop-filter: blur(12px); border-bottom: 1px solid #eee; }
.nav-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; height: 68px; }
.nav-brand  { font-size: 1.3rem; font-weight: 800; color: var(--primary); }
.nav-links  { display: flex; gap: 32px; }
.nav-links a { font-weight: 500; color: #555; transition: color .2s; }
.nav-links a:hover { color: var(--primary); }
.nav-toggle { display: none; font-size: 1.5rem; background: none; border: none; cursor: pointer; }

/* ── Hero ─────────────────────────────────────────────────────────────────── */
.hero {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 60%, #0d0d1a 100%);
  color: #fff; text-align: center; padding: 120px 24px;
  position: relative; overflow: hidden;
}
.hero::before {
  content: ""; position: absolute; inset: 0;
  background: radial-gradient(circle at 50% 40%, var(--primary)33 0%, transparent 65%);
}
.hero-inner { position: relative; z-index: 1; max-width: 900px; margin: 0 auto; }
.hero h1    { font-size: clamp(2.5rem, 7vw, 5.5rem); font-weight: 900; line-height: 1.05; margin-bottom: 24px; }
.hero p     { font-size: clamp(1rem, 2.5vw, 1.35rem); color: rgba(255,255,255,.75); margin-bottom: 40px; max-width: 600px; margin-left: auto; margin-right: auto; }

/* ── Cards ────────────────────────────────────────────────────────────────── */
.card { background: var(--gray-50); border-radius: var(--radius); padding: 32px; transition: box-shadow .2s; border: 1px solid var(--gray-100); }
.card:hover { box-shadow: var(--shadow); }
.card h3 { font-size: 1.15rem; font-weight: 700; margin-bottom: 10px; }
.card p  { color: var(--gray-600); }

/* ── About ────────────────────────────────────────────────────────────────── */
.about h2 { font-size: 2.5rem; font-weight: 800; margin-bottom: 20px; }
.highlights { list-style: none; display: grid; grid-template-columns: repeat(auto-fit,minmax(220px,1fr)); gap: 12px; margin-top: 32px; }
.highlights li { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: var(--primary-light); border-radius: 8px; font-weight: 500; }
.highlights li::before { content: "✓"; color: var(--primary); font-weight: 900; }

/* ── Features ─────────────────────────────────────────────────────────────── */
.feature-item { padding: 32px; border-left: 4px solid var(--primary); background: var(--gray-50); border-radius: 0 var(--radius) var(--radius) 0; }
.feature-item h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: 8px; }

/* ── Testimonials ─────────────────────────────────────────────────────────── */
.testimonials { background: var(--gray-50); }
.testimonials h2 { font-size: 2.5rem; font-weight: 800; text-align: center; margin-bottom: 48px; }
.testimonial-card { background: #fff; padding: 32px; border-radius: var(--radius); box-shadow: var(--shadow); }
.quote  { font-size: 1rem; line-height: 1.7; color: #333; font-style: italic; margin-bottom: 20px; }
.author { display: flex; flex-direction: column; }
.author strong { font-weight: 700; }
.author span   { font-size: .875rem; color: var(--gray-600); }

/* ── FAQ ──────────────────────────────────────────────────────────────────── */
.faq h2 { font-size: 2.5rem; font-weight: 800; text-align: center; margin-bottom: 48px; }
.faq-list { display: flex; flex-direction: column; gap: 12px; }
.faq-item { border: 1px solid var(--gray-100); border-radius: var(--radius); overflow: hidden; }
.faq-q    { width: 100%; padding: 18px 24px; background: #fff; border: none; cursor: pointer; font-size: 1rem; font-weight: 600; text-align: left; display: flex; justify-content: space-between; align-items: center; }
.faq-q:hover { background: var(--gray-50); }
.faq-icon { font-size: 1.4rem; color: var(--primary); transition: transform .3s; }
.faq-a    { max-height: 0; overflow: hidden; padding: 0 24px; transition: max-height .3s ease, padding .3s; color: var(--gray-600); line-height: 1.7; }
.faq-a.open { max-height: 300px; padding: 16px 24px; }

/* ── Team ─────────────────────────────────────────────────────────────────── */
.team-card    { text-align: center; padding: 32px 20px; }
.team-avatar  { width: 72px; height: 72px; border-radius: 50%; background: var(--primary); color: #fff; font-size: 1.75rem; font-weight: 700; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
.team-card h3 { font-weight: 700; margin-bottom: 4px; }
.team-card .role { color: var(--primary); font-size: .875rem; font-weight: 600; margin-bottom: 10px; }
.team-card .bio  { color: var(--gray-600); font-size: .9rem; }

/* ── Pricing ──────────────────────────────────────────────────────────────── */
.pricing { background: var(--gray-50); }
.pricing-card { background: #fff; border-radius: var(--radius); padding: 40px 32px; border: 2px solid var(--gray-100); position: relative; }
.pricing-card.popular { border-color: var(--primary); box-shadow: 0 8px 40px var(--primary-light); }
.pricing-card .badge  { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: var(--primary); color: #fff; font-size: .75rem; font-weight: 700; padding: 4px 16px; border-radius: 50px; }
.pricing-card h3   { font-size: 1.3rem; font-weight: 800; margin-bottom: 16px; }
.price             { font-size: 2.5rem; font-weight: 900; margin-bottom: 24px; }
.price .period     { font-size: 1rem; font-weight: 400; color: var(--gray-600); }
.features-list     { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.features-list li  { padding-left: 24px; position: relative; color: var(--gray-600); }
.features-list li::before { content: "✓"; position: absolute; left: 0; color: var(--primary); font-weight: 700; }

/* ── CTA Section ──────────────────────────────────────────────────────────── */
.cta-section { background: linear-gradient(135deg, var(--primary) 0%, var(--primary)cc 100%); color: #fff; text-align: center; }
.cta-section h2 { font-size: 2.5rem; font-weight: 900; margin-bottom: 16px; }
.cta-section p  { font-size: 1.15rem; opacity: .9; margin-bottom: 40px; }
.cta-section .btn-primary { background: #fff; color: var(--primary); }

/* ── Contact ──────────────────────────────────────────────────────────────── */
.contact-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 64px; }
.contact-info p { margin-bottom: 16px; font-size: 1rem; }
.contact-info a { color: var(--primary); font-weight: 500; }
.contact-form   { display: flex; flex-direction: column; gap: 16px; }
.contact-form input,
.contact-form textarea {
  padding: 14px 18px; border: 2px solid var(--gray-100); border-radius: var(--radius);
  font-size: 1rem; font-family: inherit; transition: border-color .2s; outline: none;
}
.contact-form input:focus,
.contact-form textarea:focus { border-color: var(--primary); }
.form-note { font-size: .875rem; color: var(--primary); }

/* ── Footer ───────────────────────────────────────────────────────────────── */
.footer { background: #0f0f1a; color: rgba(255,255,255,.6); padding: 40px 0; text-align: center; }

/* ── Responsive ───────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .nav-links { display: none; flex-direction: column; position: absolute; top: 68px; left: 0; right: 0; background: #fff; padding: 16px 24px; border-bottom: 1px solid #eee; box-shadow: var(--shadow); }
  .nav-links.open { display: flex; }
  .nav-toggle { display: block; }
  .contact-grid { grid-template-columns: 1fr; gap: 32px; }
  .section { padding: 64px 0; }
}
`;
}

function buildJs() {
  return `// Navigation toggle
function toggleNav() {
  document.getElementById("nav-links").classList.toggle("open");
}

// FAQ toggle
function toggleFaq(index) {
  const answer = document.getElementById("faq-" + index);
  const icon   = answer.previousElementSibling.querySelector(".faq-icon");
  const isOpen = answer.classList.contains("open");
  document.querySelectorAll(".faq-a").forEach(a => a.classList.remove("open"));
  document.querySelectorAll(".faq-icon").forEach(i => { i.textContent = "+"; i.style.transform = ""; });
  if (!isOpen) {
    answer.classList.add("open");
    icon.textContent = "−";
    icon.style.transform = "rotate(0)";
  }
}

// Simple contact form (replace with your backend endpoint)
function handleContact(e) {
  e.preventDefault();
  const note = document.getElementById("form-note");
  note.textContent = "Thank you! We'll be in touch soon.";
  e.target.reset();
}

// Close nav when a link is clicked
document.querySelectorAll(".nav-links a").forEach(a => {
  a.addEventListener("click", () => document.getElementById("nav-links").classList.remove("open"));
});
`;
}

function buildReadme(businessName, pages) {
  return `# ${businessName} — Static Website

## Project Structure
\`\`\`
${pages.map(p => `${p.slug === "home" ? "index.html" : p.slug + ".html"}`).join("\n")}
assets/
  style.css    ← all styles
  main.js      ← interactions (FAQ accordion, nav toggle, contact form)
README.md
\`\`\`

## How to Run

This is a **pure HTML/CSS/JS** website — no build tools or servers required.

### Option 1 — Open directly
Double-click \`index.html\` to open in your browser.

### Option 2 — Local server (recommended for multi-page links)
\`\`\`bash
# Python
python3 -m http.server 3000

# Node.js (npx)
npx serve .
\`\`\`
Then open **http://localhost:3000**

## Customisation
- **Primary colour** — change \`--primary\` in \`assets/style.css\` (line ~10)
- **Content** — edit the HTML sections directly in each \`.html\` file
- **Contact form** — replace \`handleContact()\` in \`assets/main.js\` with a real API call (e.g. EmailJS, Formspree)

## Deployment
Upload all files to any static host:
- **Netlify** — drag-and-drop the folder at netlify.com/drop
- **Vercel** — \`npx vercel\`
- **GitHub Pages** — push to a repo and enable Pages in settings
- **cPanel / Shared Hosting** — upload via FTP to \`public_html/\`
`;
}

function generateHtml(project) {
  const pc    = project.primaryColor || "#6344d4";
  const bName = project.businessName || "My Website";
  const pages = project.pages || [];

  const files = {};

  // assets
  files["assets/style.css"] = buildCss(pc);
  files["assets/main.js"]   = buildJs();
  files["README.md"]        = buildReadme(bName, pages);

  // pages
  pages.forEach((page) => {
    const sectionsHtml = (page.blocks || []).map(b => blockToSection(b, pc)).join("\n");
    const navHtml      = buildNav(pages, bName);
    const isHome       = page.slug === "home";
    const filename     = isHome ? "index.html" : `${page.slug}.html`;
    files[filename]    = buildPage(page.name, sectionsHtml, navHtml, bName, pc, isHome);
  });

  if (!files["index.html"]) {
    files["index.html"] = buildPage(bName, "", buildNav(pages, bName), bName, pc, true);
  }

  return files;
}

module.exports = { generateHtml };
