// ── Laravel 10 Generator ──────────────────────────────────────────────────────

function esc(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function phpStr(v) { return "'" + String(v ?? "").replace(/'/g, "\\'") + "'"; }

function blockToPartial(block, pc) {
  const c = block.content || {};
  switch (block.type) {
    case "hero":
    case "banner":
      return `<section class="hero">
    <div class="hero-inner">
        <h1>${esc(c.headline || c.heading || "Welcome")}</h1>
        <p>${esc(c.subheadline || c.subheading || "")}</p>
        ${(c.ctaText || c.cta) ? `<a href="${esc(c.ctaLink || "#contact")}" class="btn-primary">${esc(c.ctaText || c.cta)}</a>` : ""}
    </div>
</section>`;

    case "about":
      return `<section id="about" class="section">
    <div class="container">
        <h2>${esc(c.title || "About Us")}</h2>
        <p class="lead">${esc(c.body || "")}</p>
        ${(c.highlights || []).length ? `<ul class="highlights">
            ${(c.highlights || []).map(h => `<li>${esc(h)}</li>`).join("\n            ")}
        </ul>` : ""}
    </div>
</section>`;

    case "services":
      return `<section id="services" class="section bg-light">
    <div class="container">
        <div class="section-header">
            <h2>${esc(c.title || "Services")}</h2>
            <p>${esc(c.subtitle || "")}</p>
        </div>
        <div class="grid grid-3">
            ${(c.items || []).map(item => `<div class="card">
                <h3>${esc(item.title)}</h3>
                <p>${esc(item.description)}</p>
            </div>`).join("\n            ")}
        </div>
    </div>
</section>`;

    case "features":
      return `<section id="features" class="section">
    <div class="container">
        <div class="section-header">
            <h2>${esc(c.title || "Features")}</h2>
            <p>${esc(c.subtitle || "")}</p>
        </div>
        <div class="grid grid-3">
            ${(c.items || []).map(item => `<div class="feature-item">
                <h3>${esc(item.title)}</h3>
                <p>${esc(item.description)}</p>
            </div>`).join("\n            ")}
        </div>
    </div>
</section>`;

    case "testimonials":
      return `<section id="testimonials" class="section bg-light">
    <div class="container">
        <h2 class="text-center mb-16">${esc(c.title || "Testimonials")}</h2>
        <div class="grid grid-3">
            ${(c.items || []).map(t => `<div class="testimonial-card">
                <p class="quote">"${esc(t.quote)}"</p>
                <div class="author">
                    <strong>${esc(t.name)}</strong>
                    <span>${esc(t.role)}${t.company ? ` · ${esc(t.company)}` : ""}</span>
                </div>
            </div>`).join("\n            ")}
        </div>
    </div>
</section>`;

    case "faq":
      return `<section id="faq" class="section">
    <div class="container narrow">
        <h2 class="text-center mb-16">${esc(c.title || "FAQ")}</h2>
        <div class="faq-list">
            ${(c.items || []).map((item, i) => `<div class="faq-item">
                <button class="faq-q" data-faq="${i}">${esc(item.question)}<span class="faq-icon">+</span></button>
                <div class="faq-a" id="faq-${i}">${esc(item.answer)}</div>
            </div>`).join("\n            ")}
        </div>
    </div>
</section>`;

    case "team":
      return `<section id="team" class="section bg-light">
    <div class="container">
        <div class="section-header">
            <h2>${esc(c.title || "Our Team")}</h2>
            <p>${esc(c.subtitle || "")}</p>
        </div>
        <div class="grid grid-4">
            ${(c.items || []).map(m => `<div class="team-card">
                <div class="team-avatar">${esc(m.name?.[0] || "?")}</div>
                <h3>${esc(m.name)}</h3>
                <p class="role">${esc(m.role)}</p>
                <p>${esc(m.bio)}</p>
            </div>`).join("\n            ")}
        </div>
    </div>
</section>`;

    case "pricing":
      return `<section id="pricing" class="section bg-light">
    <div class="container">
        <div class="section-header">
            <h2>${esc(c.title || "Pricing")}</h2>
            <p>${esc(c.subtitle || "")}</p>
        </div>
        <div class="grid grid-3">
            ${(c.tiers || []).map(tier => `<div class="pricing-card${tier.popular ? " popular" : ""}">
                ${tier.popular ? '<span class="badge">Most Popular</span>' : ""}
                <h3>${esc(tier.name)}</h3>
                <div class="price"><span>${esc(tier.price)}</span> / ${esc(tier.period)}</div>
                <ul class="features-list">
                    ${(tier.features || []).map(f => `<li>${esc(f)}</li>`).join("\n                    ")}
                </ul>
                <a href="#contact" class="btn-plan${tier.popular ? " btn-primary" : ""}">Get Started</a>
            </div>`).join("\n            ")}
        </div>
    </div>
</section>`;

    case "cta":
      return `<section id="cta" class="section cta-section">
    <div class="container text-center">
        <h2>${esc(c.headline || c.heading || "Ready to get started?")}</h2>
        <p>${esc(c.subtext || c.subheading || "")}</p>
        ${(c.buttonText || c.cta) ? `<a href="${esc(c.buttonLink || c.ctaLink || "#contact")}" class="btn-white">${esc(c.buttonText || c.cta)}</a>` : ""}
    </div>
</section>`;

    case "contact":
      return `<section id="contact" class="section">
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
            <form method="POST" action="{{ route('contact.submit') }}">
                @csrf
                @if(session('success'))
                    <div class="form-success">{{ session('success') }}</div>
                @endif
                <input type="text" name="name" placeholder="Your Name" required />
                <input type="email" name="email" placeholder="Your Email" required />
                <textarea name="message" rows="5" placeholder="Your Message" required></textarea>
                <button type="submit" class="btn-primary">Send Message</button>
            </form>
        </div>
    </div>
</section>`;

    default:
      return "";
  }
}

function buildLayout(businessName, pages, pc) {
  const navLinks = pages.map(p => {
    const url = p.slug === "home" ? "/" : `/${p.slug}`;
    return `        <a href="{{ url('${url === "/" ? "" : url.slice(1)}') }}" class="nav-link">{{ __(${phpStr(p.name)}) }}</a>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="csrf-token" content="{{ csrf_token() }}" />
    <title>@yield('title', ${phpStr(businessName)})</title>
    <link rel="stylesheet" href="{{ asset('css/style.css') }}" />
    <style>:root { --primary: ${pc}; }</style>
</head>
<body>
    <nav class="navbar" id="navbar">
        <div class="nav-inner">
            <a href="{{ url('/') }}" class="nav-brand">${esc(businessName)}</a>
            <button class="nav-toggle" onclick="toggleNav()">&#9776;</button>
            <div class="nav-links" id="nav-links">
${navLinks}
            </div>
        </div>
    </nav>

    <main>@yield('content')</main>

    <footer class="footer">
        <div class="container">
            <p>&copy; {{ date('Y') }} ${esc(businessName)}. All rights reserved.</p>
        </div>
    </footer>

    <script src="{{ asset('js/main.js') }}"></script>
</body>
</html>`;
}

function buildWebRoutes(pages) {
  const homeSlug = pages.find(p => p.slug === "home") ? "home" : pages[0]?.slug;
  const lines = pages.map(p => {
    const ctrl = toPascalCase(p.slug) + "Controller";
    if (p.slug === "home") {
      return `Route::get('/', [${ctrl}::class, 'index'])->name('home');`;
    }
    return `Route::get('/${p.slug}', [${ctrl}::class, 'index'])->name('${p.slug}');`;
  });
  lines.push("");
  lines.push("// Contact form");
  lines.push("Route::post('/contact', [ContactController::class, 'submit'])->name('contact.submit');");
  const uses = pages.map(p => `use App\\Http\\Controllers\\${toPascalCase(p.slug)}Controller;`);
  uses.push("use App\\Http\\Controllers\\ContactController;");
  return `<?php

use Illuminate\\Support\\Facades\\Route;
${uses.join("\n")}

${lines.join("\n")}
`;
}

function buildController(pageName, viewName) {
  return `<?php

namespace App\\Http\\Controllers;

use Illuminate\\View\\View;

class ${toPascalCase(pageName)}Controller extends Controller
{
    public function index(): View
    {
        return view('${viewName}');
    }
}
`;
}

function buildContactController(useMysql) {
  return `<?php

namespace App\\Http\\Controllers;

use Illuminate\\Http\\Request;
use Illuminate\\Http\\RedirectResponse;
${useMysql ? "use App\\Models\\Contact;" : ""}

class ContactController extends Controller
{
    public function submit(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'    => 'required|string|max:255',
            'email'   => 'required|email|max:255',
            'message' => 'required|string',
        ]);

${useMysql ? `        Contact::create($validated);` : `        // TODO: send email or save to DB
        // Mail::to(config('mail.from.address'))->send(new ContactMail($validated));`}

        return redirect()->back()->with('success', "Thank you! We'll be in touch soon.");
    }
}
`;
}

function toPascalCase(str) {
  return str.replace(/(^\w|-\w)/g, c => c.replace("-", "").toUpperCase());
}

function buildMigration(name, date) {
  return `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('${name}', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email');
            $table->text('message');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('${name}');
    }
};
`;
}

function buildContactModel() {
  return `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Factories\\HasFactory;
use Illuminate\\Database\\Eloquent\\Model;

class Contact extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'email', 'message'];
}
`;
}

function buildCss(pc) {
  // Reuse the same CSS from html.js but with minor tweaks for Laravel context
  return `/* Shared stylesheet — see html generator for full version */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { font-family: 'Inter', -apple-system, system-ui, sans-serif; color: #111; background: #fff; line-height: 1.6; }
a { color: inherit; text-decoration: none; }
:root { --primary: ${pc}; --primary-light: ${pc}22; --gray-50: #f9fafb; --gray-100: #f3f4f6; --gray-600: #4b5563; --radius: 12px; --shadow: 0 4px 24px rgba(0,0,0,.08); }
.container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
.narrow { max-width: 760px; }
.text-center { text-align: center; }
.lead { font-size: 1.2rem; color: var(--gray-600); }
.section { padding: 96px 0; }
.section.bg-light { background: var(--gray-50); }
.section-header { text-align: center; margin-bottom: 64px; }
.section-header h2 { font-size: 2.5rem; font-weight: 800; margin-bottom: 12px; }
.section-header p { font-size: 1.15rem; color: var(--gray-600); }
.mb-16 { margin-bottom: 4rem; }
.grid { display: grid; gap: 28px; }
.grid-3 { grid-template-columns: repeat(auto-fit, minmax(260px,1fr)); }
.grid-4 { grid-template-columns: repeat(auto-fit, minmax(200px,1fr)); }
.btn-primary { display: inline-block; padding: 14px 36px; background: var(--primary); color: #fff; border-radius: 50px; font-weight: 700; font-size: 1rem; transition: .2s; border: none; cursor: pointer; }
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 30px var(--primary-light); }
.btn-white { display: inline-block; padding: 14px 36px; background: #fff; color: var(--primary); border-radius: 50px; font-weight: 700; transition: .2s; }
.btn-plan { display: block; margin-top: 24px; padding: 12px 24px; border-radius: 8px; border: 2px solid var(--primary); color: var(--primary); font-weight: 600; text-align: center; transition: .2s; }
.btn-plan:hover { background: var(--primary); color: #fff; }
.navbar { position: sticky; top: 0; z-index: 100; background: rgba(255,255,255,.95); backdrop-filter: blur(12px); border-bottom: 1px solid #eee; }
.nav-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; height: 68px; }
.nav-brand { font-size: 1.3rem; font-weight: 800; color: var(--primary); }
.nav-links { display: flex; gap: 32px; }
.nav-link { font-weight: 500; color: #555; transition: color .2s; }
.nav-link:hover { color: var(--primary); }
.nav-toggle { display: none; font-size: 1.5rem; background: none; border: none; cursor: pointer; }
.hero { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg,#0f0f1a,#1a1a2e); color: #fff; text-align: center; padding: 120px 24px; }
.hero-inner { max-width: 900px; margin: 0 auto; }
.hero h1 { font-size: clamp(2.5rem,7vw,5.5rem); font-weight: 900; line-height: 1.05; margin-bottom: 24px; }
.hero p { font-size: clamp(1rem,2.5vw,1.35rem); color: rgba(255,255,255,.75); margin-bottom: 40px; }
.card { background: var(--gray-50); border-radius: var(--radius); padding: 32px; transition: box-shadow .2s; border: 1px solid var(--gray-100); }
.card:hover { box-shadow: var(--shadow); }
.card h3 { font-size: 1.15rem; font-weight: 700; margin-bottom: 10px; }
.card p { color: var(--gray-600); }
.about h2 { font-size: 2.5rem; font-weight: 800; margin-bottom: 20px; }
.highlights { list-style: none; display: grid; grid-template-columns: repeat(auto-fit,minmax(220px,1fr)); gap: 12px; margin-top: 32px; }
.highlights li { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: var(--primary-light); border-radius: 8px; font-weight: 500; }
.highlights li::before { content: "✓"; color: var(--primary); font-weight: 900; }
.feature-item { padding: 32px; border-left: 4px solid var(--primary); background: var(--gray-50); border-radius: 0 var(--radius) var(--radius) 0; }
.testimonial-card { background: #fff; padding: 32px; border-radius: var(--radius); box-shadow: var(--shadow); }
.quote { font-size: 1rem; line-height: 1.7; color: #333; font-style: italic; margin-bottom: 20px; }
.author { display: flex; flex-direction: column; }
.author strong { font-weight: 700; }
.author span { font-size: .875rem; color: var(--gray-600); }
.faq-list { display: flex; flex-direction: column; gap: 12px; }
.faq-item { border: 1px solid var(--gray-100); border-radius: var(--radius); overflow: hidden; }
.faq-q { width: 100%; padding: 18px 24px; background: #fff; border: none; cursor: pointer; font-size: 1rem; font-weight: 600; text-align: left; display: flex; justify-content: space-between; align-items: center; }
.faq-q:hover { background: var(--gray-50); }
.faq-icon { font-size: 1.4rem; color: var(--primary); }
.faq-a { max-height: 0; overflow: hidden; padding: 0 24px; transition: max-height .3s ease, padding .3s; color: var(--gray-600); }
.faq-a.open { max-height: 300px; padding: 16px 24px; }
.team-card { text-align: center; padding: 32px 20px; }
.team-avatar { width: 72px; height: 72px; border-radius: 50%; background: var(--primary); color: #fff; font-size: 1.75rem; font-weight: 700; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
.team-card h3 { font-weight: 700; margin-bottom: 4px; }
.team-card .role { color: var(--primary); font-size: .875rem; font-weight: 600; margin-bottom: 10px; }
.pricing-card { background: #fff; border-radius: var(--radius); padding: 40px 32px; border: 2px solid var(--gray-100); position: relative; }
.pricing-card.popular { border-color: var(--primary); box-shadow: 0 8px 40px var(--primary-light); }
.badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: var(--primary); color: #fff; font-size: .75rem; font-weight: 700; padding: 4px 16px; border-radius: 50px; }
.pricing-card h3 { font-size: 1.3rem; font-weight: 800; margin-bottom: 16px; }
.price { font-size: 2.5rem; font-weight: 900; margin-bottom: 24px; }
.features-list { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.features-list li { padding-left: 24px; position: relative; color: var(--gray-600); }
.features-list li::before { content: "✓"; position: absolute; left: 0; color: var(--primary); font-weight: 700; }
.cta-section { background: var(--primary); color: #fff; text-align: center; }
.cta-section h2 { font-size: 2.5rem; font-weight: 900; margin-bottom: 16px; }
.cta-section p { font-size: 1.15rem; opacity: .9; margin-bottom: 40px; }
.contact-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 64px; }
.contact-info p { margin-bottom: 16px; }
.contact-info a { color: var(--primary); font-weight: 500; }
.contact-form, form { display: flex; flex-direction: column; gap: 16px; }
form input, form textarea { padding: 14px 18px; border: 2px solid var(--gray-100); border-radius: var(--radius); font-size: 1rem; font-family: inherit; transition: border-color .2s; outline: none; }
form input:focus, form textarea:focus { border-color: var(--primary); }
.form-success { background: #d1fae5; color: #065f46; padding: 12px 16px; border-radius: 8px; }
.footer { background: #0f0f1a; color: rgba(255,255,255,.6); padding: 40px 0; text-align: center; }
@media (max-width: 768px) { .nav-links { display: none; flex-direction: column; position: absolute; top: 68px; left: 0; right: 0; background: #fff; padding: 16px 24px; border-bottom: 1px solid #eee; } .nav-links.open { display: flex; } .nav-toggle { display: block; } .contact-grid { grid-template-columns: 1fr; } .section { padding: 64px 0; } }
`;
}

function generateLaravel(project, database) {
  const pc      = project.primaryColor || "#6344d4";
  const bName   = project.businessName || "My Website";
  const pages   = project.pages || [];
  const useMysql = database === "mysql";
  const files   = {};

  // ── Layout ─────────────────────────────────────────────────────────────────
  files["resources/views/layouts/app.blade.php"] = buildLayout(bName, pages, pc);

  // ── Page views ─────────────────────────────────────────────────────────────
  pages.forEach(page => {
    const sections = (page.blocks || []).map(b => blockToPartial(b, pc)).join("\n\n");
    const view = page.slug === "home" ? "home" : page.slug;
    files[`resources/views/${view}.blade.php`] = `@extends('layouts.app')

@section('title', ${phpStr(page.name + " | " + bName)})

@section('content')
${sections || `<section class="section"><div class="container"><h2>${esc(page.name)}</h2></div></section>`}
@endsection
`;
  });

  // ── Routes ─────────────────────────────────────────────────────────────────
  files["routes/web.php"] = buildWebRoutes(pages);

  // ── Controllers ────────────────────────────────────────────────────────────
  pages.forEach(page => {
    const view = page.slug === "home" ? "home" : page.slug;
    files[`app/Http/Controllers/${toPascalCase(page.slug)}Controller.php`] = buildController(page.slug, view);
  });
  files["app/Http/Controllers/ContactController.php"] = buildContactController(useMysql);

  // ── Assets ─────────────────────────────────────────────────────────────────
  files["public/css/style.css"] = buildCss(pc);
  files["public/js/main.js"] = `function toggleNav() { document.getElementById("nav-links").classList.toggle("open"); }
document.querySelectorAll(".faq-q").forEach(btn => {
  btn.addEventListener("click", () => {
    const id  = btn.getAttribute("data-faq");
    const ans = document.getElementById("faq-" + id);
    const icon = btn.querySelector(".faq-icon");
    const open = ans.classList.toggle("open");
    icon.textContent = open ? "−" : "+";
  });
});
`;

  // ── Database ───────────────────────────────────────────────────────────────
  if (useMysql) {
    const ts = "2024_01_01_000001";
    files[`database/migrations/${ts}_create_contacts_table.php`] = buildMigration("contacts", ts);
    files["app/Models/Contact.php"] = buildContactModel();
  }

  // ── composer.json ──────────────────────────────────────────────────────────
  files["composer.json"] = JSON.stringify({
    name: "app/" + bName.toLowerCase().replace(/\s+/g, "-"),
    description: project.tagline || bName,
    type: "project",
    require: {
      php: "^8.2",
      "laravel/framework": "^10.0",
      "laravel/tinker": "^2.8",
    },
    "require-dev": {
      "laravel/pint": "^1.0",
      "laravel/sail": "^1.18",
      "phpunit/phpunit": "^10.1",
    },
    autoload: {
      psr4: { "App\\": "app/", "Database\\Factories\\": "database/factories/", "Database\\Seeders\\": "database/seeders/" },
    },
    scripts: {
      post_autoload_dump: ["Illuminate\\Foundation\\ComposerScripts::postAutoloadDump", "@php artisan package:discover --ansi"],
      post_install_cmd: ["@php artisan key:generate --ansi"],
    },
    config: { optimize_autoloader: true, preferred_install: "dist", sort_packages: true },
    minimum_stability: "stable",
    prefer_stable: true,
  }, null, 2);

  // ── .env.example ──────────────────────────────────────────────────────────
  files[".env.example"] = `APP_NAME="${bName}"
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost

LOG_CHANNEL=stack
LOG_LEVEL=debug

DB_CONNECTION=${useMysql ? "mysql" : "sqlite"}
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=${bName.toLowerCase().replace(/\s+/g, "_")}
DB_USERNAME=root
DB_PASSWORD=

MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="${bName.toLowerCase().replace(/\s+/g, "")}@example.com"
MAIL_FROM_NAME="\${APP_NAME}"
`;

  // ── README ─────────────────────────────────────────────────────────────────
  files["README.md"] = `# ${bName} — Laravel Website

## Tech Stack
- **Framework:** Laravel 10
- **PHP:** 8.2+
- **Database:** ${useMysql ? "MySQL 8+" : "SQLite (default, no setup needed)"}
- **Styling:** Custom CSS (no Tailwind build step required)

## Prerequisites
- PHP 8.2+
- Composer
- ${useMysql ? "MySQL 8+ running" : "No database setup needed (SQLite works out of the box)"}

## Getting Started

### 1. Install PHP dependencies
\`\`\`bash
composer install
\`\`\`

### 2. Configure environment
\`\`\`bash
cp .env.example .env
php artisan key:generate
\`\`\`
${useMysql ? `
### 3. Set up the database
Edit \`.env\` and set your \`DB_*\` values, then run:
\`\`\`bash
php artisan migrate
\`\`\`

### 4. Start the dev server` : `
### 3. Start the dev server`}
\`\`\`bash
php artisan serve
\`\`\`

Open **http://localhost:8000**

## Production Deployment
- Point your web server (Apache/nginx) document root to the \`public/\` folder
- Run \`composer install --optimize-autoloader --no-dev\`
- Run \`php artisan config:cache && php artisan route:cache\`
- Set \`APP_ENV=production\` and \`APP_DEBUG=false\` in \`.env\`

## Customise
- **Primary colour** — change \`--primary\` in \`public/css/style.css\`
- **Page content** — edit blade files in \`resources/views/\`
- **Add pages** — create a controller + view + route following the existing pattern
- **Contact form email** — update \`ContactController@submit\` with your email provider (Laravel Mail)
`;

  return files;
}

module.exports = { generateLaravel };
