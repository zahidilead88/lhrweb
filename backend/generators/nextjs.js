// ── Next.js 14 App Router Generator ──────────────────────────────────────────

function esc(v) { return String(v ?? "").replace(/`/g, "\\`").replace(/\$/g, "\\$"); }
function jsStr(v) { return JSON.stringify(String(v ?? "")); }

// ── Per-block React component ─────────────────────────────────────────────────
function blockToComponent(block) {
  const c = block.content || {};
  switch (block.type) {
    case "hero":
    case "banner":
      return `export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center text-white overflow-hidden" style={{ background: "linear-gradient(135deg,#0f0f1a,#1a1a2e)" }}>
      <div className="absolute inset-0 opacity-20" style={{ background: \`radial-gradient(circle at 50% 40%, var(--primary) 0%, transparent 65%)\` }} />
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6">${esc(c.headline || c.heading || "Welcome")}</h1>
        <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto">${esc(c.subheadline || c.subheading || "")}</p>
        ${(c.ctaText || c.cta) ? `<a href="${esc(c.ctaLink || "#contact")}" className="inline-block px-10 py-4 rounded-full font-bold text-lg transition-transform hover:-translate-y-1" style={{ background: "var(--primary)" }}>${esc(c.ctaText || c.cta)}</a>` : ""}
      </div>
    </section>
  );
}`;

    case "about":
      return `export function About() {
  return (
    <section id="about" className="py-24 px-6 bg-white">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl font-extrabold mb-6">${esc(c.title || "About Us")}</h2>
        <p className="text-xl text-gray-600 leading-relaxed mb-10">${esc(c.body || "")}</p>
        ${(c.highlights || []).length ? `<ul className="grid md:grid-cols-2 gap-3">
          ${(c.highlights || []).map((h) => `<li className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 font-medium"><span className="text-[--primary]">✓</span>${esc(h)}</li>`).join("\n          ")}
        </ul>` : ""}
      </div>
    </section>
  );
}`;

    case "services":
      return `export function Services() {
  const items = ${JSON.stringify(c.items || [])};
  return (
    <section id="services" className="py-24 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold mb-4">${esc(c.title || "Services")}</h2>
          <p className="text-xl text-gray-600">${esc(c.subtitle || "")}</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item, i) => (
            <div key={i} className="bg-white p-8 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold mb-3">{item.title}</h3>
              <p className="text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`;

    case "features":
      return `export function Features() {
  const items = ${JSON.stringify(c.items || [])};
  return (
    <section id="features" className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold mb-4">${esc(c.title || "Features")}</h2>
          <p className="text-xl text-gray-600">${esc(c.subtitle || "")}</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item, i) => (
            <div key={i} className="p-8 border-l-4 bg-gray-50 rounded-r-2xl" style={{ borderColor: "var(--primary)" }}>
              <h3 className="text-xl font-bold mb-3">{item.title}</h3>
              <p className="text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`;

    case "testimonials":
      return `export function Testimonials() {
  const items = ${JSON.stringify(c.items || [])};
  return (
    <section id="testimonials" className="py-24 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-extrabold text-center mb-16">${esc(c.title || "Testimonials")}</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((t, i) => (
            <div key={i} className="bg-white p-8 rounded-2xl shadow-sm">
              <p className="text-gray-700 italic mb-6 leading-relaxed">"{t.quote}"</p>
              <div>
                <p className="font-bold">{t.name}</p>
                <p className="text-sm text-gray-500">{t.role}{t.company ? \` · \${t.company}\` : ""}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`;

    case "faq":
      return `"use client";
import { useState } from "react";
export function Faq() {
  const items = ${JSON.stringify(c.items || [])};
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section id="faq" className="py-24 px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-4xl font-extrabold text-center mb-16">${esc(c.title || "FAQ")}</h2>
        <div className="flex flex-col gap-3">
          {items.map((item, i) => (
            <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                className="w-full px-6 py-5 flex justify-between items-center text-left font-semibold hover:bg-gray-50 transition-colors"
                onClick={() => setOpen(open === i ? null : i)}
              >
                {item.question}
                <span className="text-xl" style={{ color: "var(--primary)" }}>{open === i ? "−" : "+"}</span>
              </button>
              {open === i && (
                <div className="px-6 py-4 text-gray-600 border-t border-gray-100">{item.answer}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`;

    case "team":
      return `export function Team() {
  const members = ${JSON.stringify(c.items || [])};
  return (
    <section id="team" className="py-24 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold mb-4">${esc(c.title || "Our Team")}</h2>
          <p className="text-xl text-gray-600">${esc(c.subtitle || "")}</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {members.map((m, i) => (
            <div key={i} className="text-center p-8 bg-white rounded-2xl shadow-sm">
              <div className="w-18 h-18 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4" style={{ background: "var(--primary)", width: "72px", height: "72px" }}>
                {m.name?.[0]}
              </div>
              <h3 className="font-bold text-lg">{m.name}</h3>
              <p className="text-sm font-semibold mb-2" style={{ color: "var(--primary)" }}>{m.role}</p>
              <p className="text-sm text-gray-600">{m.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`;

    case "pricing":
      return `export function Pricing() {
  const tiers = ${JSON.stringify(c.tiers || [])};
  return (
    <section id="pricing" className="py-24 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold mb-4">${esc(c.title || "Pricing")}</h2>
          <p className="text-xl text-gray-600">${esc(c.subtitle || "")}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 items-stretch">
          {tiers.map((tier, i) => (
            <div key={i} className={\`relative bg-white rounded-2xl p-10 border-2 \${tier.popular ? "shadow-2xl" : "border-gray-100"}\`} style={tier.popular ? { borderColor: "var(--primary)" } : {}}>
              {tier.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-xs font-bold px-4 py-1 rounded-full" style={{ background: "var(--primary)" }}>Most Popular</span>}
              <h3 className="text-xl font-black mb-4">{tier.name}</h3>
              <div className="text-4xl font-black mb-6">{tier.price}<span className="text-base font-normal text-gray-500"> / {tier.period}</span></div>
              <ul className="flex flex-col gap-3 mb-8">
                {tier.features.map((f, j) => <li key={j} className="flex gap-2 text-gray-600"><span style={{ color: "var(--primary)" }}>✓</span>{f}</li>)}
              </ul>
              <a href="#contact" className="block text-center py-3 rounded-xl font-bold transition-colors border-2" style={tier.popular ? { background: "var(--primary)", color: "#fff", borderColor: "var(--primary)" } : { borderColor: "var(--primary)", color: "var(--primary)" }}>Get Started</a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`;

    case "cta":
      return `export function Cta() {
  return (
    <section id="cta" className="py-24 px-6 text-white text-center" style={{ background: "var(--primary)" }}>
      <div className="max-w-3xl mx-auto">
        <h2 className="text-4xl font-extrabold mb-4">${esc(c.headline || c.heading || "Ready to get started?")}</h2>
        <p className="text-xl opacity-90 mb-10">${esc(c.subtext || c.subheading || "")}</p>
        ${(c.buttonText || c.cta) ? `<a href="${esc(c.buttonLink || c.ctaLink || "#contact")}" className="inline-block px-10 py-4 bg-white font-bold text-lg rounded-full transition-transform hover:-translate-y-1" style={{ color: "var(--primary)" }}>${esc(c.buttonText || c.cta)}</a>` : ""}
      </div>
    </section>
  );
}`;

    case "contact":
      return `"use client";
import { useState } from "react";
export function Contact() {
  const [status, setStatus] = useState("");
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd   = new FormData(e.currentTarget);
    const body = { name: fd.get("name"), email: fd.get("email"), message: fd.get("message") };
    try {
      const r = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      setStatus(r.ok ? "Message sent! We'll be in touch." : "Something went wrong. Please try again.");
    } catch { setStatus("Something went wrong. Please try again."); }
    (e.target as HTMLFormElement).reset();
  }
  return (
    <section id="contact" className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold mb-4">${esc(c.title || "Contact Us")}</h2>
          <p className="text-xl text-gray-600">${esc(c.subtitle || "")}</p>
        </div>
        <div className="grid md:grid-cols-2 gap-16">
          <div className="space-y-4 text-gray-700">
            ${c.email ? `<p><strong>Email:</strong> <a href="mailto:${esc(c.email)}" className="text-[--primary] hover:underline">${esc(c.email)}</a></p>` : ""}
            ${c.phone ? `<p><strong>Phone:</strong> <a href="tel:${esc(c.phone)}" className="text-[--primary] hover:underline">${esc(c.phone)}</a></p>` : ""}
            ${c.address ? `<p><strong>Address:</strong> ${esc(c.address)}</p>` : ""}
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input name="name" type="text" placeholder="Your Name" required className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[--primary] transition-colors" />
            <input name="email" type="email" placeholder="Your Email" required className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[--primary] transition-colors" />
            <textarea name="message" rows={5} placeholder="Your Message" required className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[--primary] transition-colors resize-none" />
            <button type="submit" className="py-4 rounded-xl font-bold text-white transition-opacity hover:opacity-90" style={{ background: "var(--primary)" }}>Send Message</button>
            {status && <p className="text-sm" style={{ color: "var(--primary)" }}>{status}</p>}
          </form>
        </div>
      </div>
    </section>
  );
}`;

    default:
      return null;
  }
}

function componentName(type) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function generateNextjs(project, database) {
  const pc    = project.primaryColor || "#6344d4";
  const bName = project.businessName || "My Website";
  const pages = project.pages || [];
  const useMongo = database === "mongodb";
  const useMysql = database === "mysql";
  const files = {};

  // ── Collect unique block types across all pages ────────────────────────────
  const usedTypes = new Set();
  pages.forEach(p => (p.blocks || []).forEach(b => usedTypes.add(b.type)));

  // ── Generate component files ───────────────────────────────────────────────
  const typeToBlock = {};
  pages.forEach(p => (p.blocks || []).forEach(b => { if (!typeToBlock[b.type]) typeToBlock[b.type] = b; }));

  for (const type of usedTypes) {
    const src = blockToComponent(typeToBlock[type]);
    if (src) files[`components/sections/${componentName(type)}.tsx`] = src;
  }

  // ── app/page.tsx (home) ────────────────────────────────────────────────────
  const homePage = pages.find(p => p.slug === "home") || pages[0];
  if (homePage) {
    const imports = (homePage.blocks || [])
      .filter(b => usedTypes.has(b.type) && blockToComponent(typeToBlock[b.type]))
      .map(b => `import { ${componentName(b.type)} } from "@/components/sections/${componentName(b.type)}";`)
      .join("\n");
    const jsx = (homePage.blocks || [])
      .filter(b => blockToComponent(typeToBlock[b.type]))
      .map(b => `      <${componentName(b.type)} />`)
      .join("\n");
    files["app/page.tsx"] = `${imports}

export default function Home() {
  return (
    <main>
${jsx}
    </main>
  );
}
`;
  }

  // ── Additional pages ───────────────────────────────────────────────────────
  pages.filter(p => p.slug !== "home").forEach(page => {
    const imports = (page.blocks || [])
      .filter(b => blockToComponent(typeToBlock[b.type]))
      .map(b => `import { ${componentName(b.type)} } from "@/components/sections/${componentName(b.type)}";`)
      .join("\n");
    const jsx = (page.blocks || [])
      .filter(b => blockToComponent(typeToBlock[b.type]))
      .map(b => `      <${componentName(b.type)} />`)
      .join("\n");
    files[`app/${page.slug}/page.tsx`] = `${imports}

export default function ${componentName(page.slug)}Page() {
  return (
    <main>
${jsx || "      <div className=\"py-24 text-center\"><h1 className=\"text-4xl font-bold\">${page.name}</h1></div>"}
    </main>
  );
}
`;
  });

  // ── app/layout.tsx ─────────────────────────────────────────────────────────
  const navLinks = pages.map(p => `            <a href="${p.slug === "home" ? "/" : `/${p.slug}`}" className="text-gray-600 hover:text-black font-medium transition-colors">{${jsStr(p.name)}}</a>`).join("\n");
  files["app/layout.tsx"] = `import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: ${jsStr(bName)},
  description: ${jsStr(project.tagline || bName)},
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <a href="/" className="text-xl font-black" style={{ color: "var(--primary)" }}>${esc(bName)}</a>
            <div className="hidden md:flex gap-8">
${navLinks}
            </div>
          </div>
        </nav>
        {children}
        <footer className="bg-gray-900 text-gray-400 py-10 text-center">
          <p>&copy; {new Date().getFullYear()} ${esc(bName)}. All rights reserved.</p>
        </footer>
      </body>
    </html>
  );
}
`;

  // ── app/globals.css ────────────────────────────────────────────────────────
  files["app/globals.css"] = `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --primary: ${pc};
}

html { scroll-behavior: smooth; }
`;

  // ── package.json ───────────────────────────────────────────────────────────
  const extraDeps = useMongo
    ? `"mongoose": "^8.0.0",\n    "mongodb": "^6.0.0",`
    : useMysql
    ? `"@prisma/client": "^5.0.0",`
    : "";
  const extraDevDeps = useMysql ? `"prisma": "^5.0.0",` : "";

  files["package.json"] = JSON.stringify({
    name: bName.toLowerCase().replace(/\s+/g, "-"),
    version: "0.1.0",
    private: true,
    scripts: {
      dev: "next dev",
      build: "next build",
      start: "next start",
      ...(useMysql ? { "db:push": "prisma db push", "db:studio": "prisma studio" } : {}),
    },
    dependencies: {
      next: "14.2.0",
      react: "^18",
      "react-dom": "^18",
      ...(useMongo ? { mongoose: "^8.0.0", mongodb: "^6.0.0" } : {}),
      ...(useMysql ? { "@prisma/client": "^5.0.0" } : {}),
    },
    devDependencies: {
      typescript: "^5",
      "@types/node": "^20",
      "@types/react": "^18",
      "@types/react-dom": "^18",
      tailwindcss: "^3.4.0",
      postcss: "^8",
      autoprefixer: "^10",
      ...(useMysql ? { prisma: "^5.0.0" } : {}),
    },
  }, null, 2);

  // ── tailwind.config.ts ─────────────────────────────────────────────────────
  files["tailwind.config.ts"] = `import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: { colors: { primary: "${pc}" } } },
  plugins: [],
};
export default config;
`;

  // ── next.config.ts ─────────────────────────────────────────────────────────
  files["next.config.ts"] = `import type { NextConfig } from "next";
const config: NextConfig = {};
export default config;
`;

  // ── tsconfig.json ──────────────────────────────────────────────────────────
  files["tsconfig.json"] = JSON.stringify({
    compilerOptions: {
      target: "ES2017", lib: ["dom", "dom.iterable", "esnext"],
      allowJs: true, skipLibCheck: true, strict: true,
      noEmit: true, esModuleInterop: true, moduleResolution: "bundler",
      resolveJsonModule: true, isolatedModules: true,
      jsx: "preserve", incremental: true,
      plugins: [{ name: "next" }],
      paths: { "@/*": ["./*"] },
    },
    include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    exclude: ["node_modules"],
  }, null, 2);

  // ── postcss.config.js ──────────────────────────────────────────────────────
  files["postcss.config.js"] = `module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } };`;

  // ── Database setup ─────────────────────────────────────────────────────────
  if (useMongo) {
    files["lib/mongodb.ts"] = `import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) throw new Error("MONGODB_URI not set in .env");

let cached = (global as any).mongoose || { conn: null, promise: null };
(global as any).mongoose = cached;

export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) cached.promise = mongoose.connect(MONGODB_URI);
  cached.conn = await cached.promise;
  return cached.conn;
}
`;
    files[".env.example"] = `MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/<dbname>
`;
    files["app/api/contact/route.ts"] = `import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { name, email, message } = await req.json();
  // TODO: save to MongoDB or send via email
  console.log("Contact form submission:", { name, email, message });
  return NextResponse.json({ ok: true });
}
`;
  } else if (useMysql) {
    files["prisma/schema.prisma"] = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model Contact {
  id        Int      @id @default(autoincrement())
  name      String
  email     String
  message   String   @db.Text
  createdAt DateTime @default(now())
}
`;
    files["lib/db.ts"] = `import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
`;
    files[".env.example"] = `DATABASE_URL=mysql://user:password@localhost:3306/mydb
`;
    files["app/api/contact/route.ts"] = `import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { name, email, message } = await req.json();
  await prisma.contact.create({ data: { name, email, message } });
  return NextResponse.json({ ok: true });
}
`;
  } else {
    files[".env.example"] = `# Add environment variables here
`;
    files["app/api/contact/route.ts"] = `import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { name, email, message } = await req.json();
  console.log("Contact form:", { name, email, message });
  // TODO: integrate with your email provider (Resend, Nodemailer, etc.)
  return NextResponse.json({ ok: true });
}
`;
  }

  // ── README ─────────────────────────────────────────────────────────────────
  files["README.md"] = buildNextjsReadme(bName, database, useMysql);

  return files;
}

function buildNextjsReadme(bName, database, useMysql) {
  return `# ${bName} — Next.js Website

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Language:** TypeScript
- **Database:** ${database === "mongodb" ? "MongoDB (Mongoose)" : database === "mysql" ? "MySQL (Prisma ORM)" : "None (static)"}

## Prerequisites
- Node.js 18+
- npm or yarn
${database === "mongodb" ? "- MongoDB Atlas account (or local MongoDB)" : ""}
${database === "mysql" ? "- MySQL 8+ server running" : ""}

## Getting Started

### 1. Install dependencies
\`\`\`bash
npm install
\`\`\`

### 2. Configure environment
\`\`\`bash
cp .env.example .env.local
\`\`\`
Edit \`.env.local\` and fill in your values.

${useMysql ? `### 3. Set up the database
\`\`\`bash
npx prisma db push      # create tables
npx prisma studio       # optional: open GUI
\`\`\`

### 4. Start the dev server
` : `### 3. Start the dev server
`}\`\`\`bash
npm run dev
\`\`\`

Open **http://localhost:3000**

## Build for Production
\`\`\`bash
npm run build
npm start
\`\`\`

## Deployment
- **Vercel** (recommended): \`npx vercel\` — zero config, auto-detects Next.js
- **Self-hosted**: build then \`npm start\` behind nginx/pm2
- **Docker**: add a Dockerfile with the standard Next.js multi-stage build

## Customise
- **Primary colour** — change \`--primary\` in \`app/globals.css\`
- **Content** — edit the component files in \`components/sections/\`
- **New pages** — add folders in \`app/\` following Next.js App Router conventions
`;
}

module.exports = { generateNextjs };
