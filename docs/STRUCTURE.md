# LHRWEB — Project Reference

## What Is This Project?

A Lahore-based digital agency website that is also a SaaS platform — customers pay for a subscription and use an AI-powered website builder to create their own sites.

- **Public marketing site** — for visitors and leads
- **Admin CMS** — manage all site content without touching code
- **Website builder** — AI + drag-and-drop; customers build their own sites
- **Stripe subscriptions** — Starter / Pro plans gate builder access

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 App Router, TypeScript, Tailwind CSS v4 |
| Backend | Express.js, MongoDB, Mongoose |
| Auth | JWT (7-day expiry, bcryptjs) — shared via `lib/authUtils.js` |
| Validation | Zod (`middleware/validate.js`, schemas in `schemas/index.js`) |
| Payments | Stripe (Checkout Sessions + Webhooks + Billing Portal) |
| AI | Google Gemini 2.5 Flash — full site + per-block generation |
| Email | Nodemailer via Gmail SMTP (`lib/email.js`) |
| File Upload | Multer → Cloudinary (if env set) or local `public/uploads/` |
| API Base | `NEXT_PUBLIC_API_URL` env var (defaults to `http://localhost:8000`) |

---

## System Layers

```
yourdomain.com              → Public website (marketing, leads)
yourdomain.com/admin        → Admin CMS panel
yourdomain.com/dashboard    → Customer dashboard (manage builder sites)
yourdomain.com/builder      → AI + drag-and-drop website builder
slug.yourdomain.com         → Published customer site (via subdomain routing)
customdomain.com            → Published customer site (via custom domain)
```

---

## User Roles

| Role | Access |
|------|--------|
| visitor | Public site, submit leads |
| user | Logged in — no builder access |
| builder | Dashboard + Builder (active Stripe subscription required) |
| admin | Full admin panel, all data |

---

## Frontend — All Pages

### Public Website `app/(frontend)/`
| Route | Purpose |
|-------|---------|
| `/` | Homepage — fetches `/api/pages/home`, renders CMS blocks |
| `/[slug]` | Dynamic pages (about, contact, etc.) — CMS-driven |
| `/blog/[id]` | Single blog post |
| `/services/[slug]` | Service detail with packages |
| `/projects/[id]` | Portfolio project detail |
| `/pricing` | Builder package pricing (Starter / Pro) |
| `/checkout/success` | Post-payment success page |
| `/checkout/cancel` | Cancelled payment page |
| `/site/[projectId]` | Preview a builder site by project ID |

### Customer Auth `app/(auth)/`
| Route | Purpose |
|-------|---------|
| `/login` | Customer login |
| `/register` | Customer register (sends welcome email) |
| `/forgot-password` | Request a password reset link |
| `/reset-password` | Set new password via email token |

### Customer Dashboard `app/(dashboard)/`
| Route | Purpose |
|-------|---------|
| `/dashboard` | Sites list, billing status, profile, support tabs |

### Website Builder `app/builder/`
| Route | Purpose |
|-------|---------|
| `/builder` | Full builder SPA — choose site, AI generate, or manual build |
| `/builder/preview` | Full-page preview of published site |

### Admin Panel `app/admin/`
| Route | Purpose |
|-------|---------|
| `/admin` | Dashboard — CMS counts + live analytics (users, subs, builder sites) |
| `/admin/login` | Admin login |
| `/admin/register` | Admin register |
| `/admin/blog` | Manage blog posts |
| `/admin/blog/add` | New blog post |
| `/admin/blog/edit/[id]` | Edit blog post |
| `/admin/project` | Manage portfolio projects |
| `/admin/project/add` | New project |
| `/admin/project/edit/[id]` | Edit project |
| `/admin/project/[id]/blocks` | Edit project content blocks |
| `/admin/pages` | CMS pages list |
| `/admin/pages/[id]/blocks` | Edit page content blocks |
| `/admin/sections` | CMS sections list |
| `/admin/sections/add` | New section |
| `/admin/sections/[id]/edit` | Edit section |
| `/admin/services` | Manage services |
| `/admin/services/add` | New service |
| `/admin/services/edit/[id]` | Edit service |
| `/admin/menu` | Nav menu management |
| `/admin/menu/add` | New menu item |
| `/admin/menu/edit/[id]` | Edit menu item |
| `/admin/footer` | Footer content |
| `/admin/leads` | View and manage contact leads |
| `/admin/users` | All registered users |
| `/admin/sites` | All customer builder sites (owner, slug, plan, status, preview) |

---

## Backend — API Routes

All routes mounted under `/api/` in `app.js`.

### Auth
| Route | File | What it does |
|-------|------|-------------|
| `POST /api/auth/register` | `routes/adminAuth.js` | Admin register |
| `POST /api/auth/login` | `routes/adminAuth.js` | Admin login |
| `POST /api/admin/auth/register` | `routes/auth.js` | Customer register + sends welcome email |
| `POST /api/admin/auth/login` | `routes/auth.js` | Customer login |
| `POST /api/admin/auth/forgot-password` | `routes/auth.js` | Generate reset token + send email |
| `POST /api/admin/auth/reset-password` | `routes/auth.js` | Validate token + update password |

### Content CMS
| Route | File | What it does |
|-------|------|-------------|
| `/api/blogs` | `routes/blogs.js` | Blog CRUD |
| `/api/projects` | `routes/projects.js` | Portfolio CRUD + image upload |
| `/api/pages` | `routes/pages.js` | CMS pages CRUD (slug-based) |
| `/api/sections` | `routes/sections.js` | CMS sections CRUD |
| `/api/services` | `routes/services.js` | Services CRUD (slug-based) |
| `/api/menu` | `routes/menu.js` | Nav menu CRUD |
| `/api/footer` | `routes/footer.js` | Footer content CRUD |
| `/api/leads` | `routes/leads.js` | Lead capture + admin status management |
| `/api/users` | `routes/userRoutes.js` | User management |
| `/api/upload` | `routes/upload.js` | File upload (Multer → Cloudinary or disk) |

### Builder
| Route | File | What it does |
|-------|------|-------------|
| `GET /api/builder/projects` | `routes/builder.js` | User's own builder projects |
| `GET /api/builder/project` | `routes/builder.js` | Single project (by query param or latest) |
| `POST /api/builder/generate` | `routes/builder.js` | AI-generate full site with Gemini |
| `POST /api/builder/generate-page` | `routes/builder.js` | AI-generate blocks for current page |
| `POST /api/builder/regenerate-block` | `routes/builder.js` | AI-regenerate a single block |
| `POST /api/builder/init-manual` | `routes/builder.js` | Create a blank site (no AI) |
| `PUT /api/builder/project/pages/:pageId` | `routes/builder.js` | Save page blocks |
| `POST /api/builder/project/pages` | `routes/builder.js` | Add a new page (Pro only) |
| `DELETE /api/builder/project/pages/:pageId` | `routes/builder.js` | Delete a page (Pro only) |
| `DELETE /api/builder/project/:projectId` | `routes/builder.js` | Delete a site |
| `GET /api/builder/public/:projectId` | `routes/builder.js` | Public preview by ID (no auth) |
| `GET /api/builder/by-slug/:slug` | `routes/builder.js` | Public: find published site by slug |
| `GET /api/builder/by-domain/:domain` | `routes/builder.js` | Public: find site by custom domain |
| `GET /api/builder/all` | `routes/builder.js` | Admin: all customer sites (populated) |
| `GET /api/builder/analytics` | `routes/builder.js` | Admin: user/sub/site counts |
| `POST /api/builder/:id/custom-domain` | `routes/builder.js` | Set custom domain + get DNS TXT token |
| `POST /api/builder/:id/verify-domain` | `routes/builder.js` | Check DNS TXT record |

### Subscriptions
| Route | File | What it does |
|-------|------|-------------|
| `POST /api/subscriptions/checkout` | `routes/subscriptions.js` | Create Stripe Checkout Session |
| `POST /api/subscriptions/portal` | `routes/subscriptions.js` | Open Stripe Billing Portal |
| `GET /api/subscriptions/status` | `routes/subscriptions.js` | Current user's subscription |
| `POST /api/subscriptions/webhook` | `routes/subscriptions.js` | Stripe webhook (raw body, idempotent) |

### Export
| Route | File | What it does |
|-------|------|-------------|
| `/api/export` | `routes/export.js` | Export builder project as HTML or Next.js zip |

---

## Backend — Middleware

| File | Purpose |
|------|---------|
| `middleware/auth.js` | Verifies JWT, attaches `req.user`; exports `requireAdmin` guard |
| `middleware/validate.js` | Zod validation factory — `validate(schema)` returns Express middleware |
| `middleware/upload.js` | Multer — Cloudinary if `CLOUDINARY_CLOUD_NAME` is set, else local disk |
| `middleware/subscriptionCheck.js` | Blocks non-builder-role users from builder routes |
| `middleware/errorHandler.js` | Global error handler — registered last in `app.js`; handles Mongoose + custom errors |

---

## Backend — Shared Libraries (`lib/`)

| File | Exports |
|------|---------|
| `lib/authUtils.js` | `hashPassword(pw)`, `comparePassword(pw, hash)`, `signToken(payload)` |
| `lib/email.js` | `sendWelcomeEmail`, `sendPaymentConfirmation`, `sendCancelledEmail`, `sendPasswordResetEmail` |
| `lib/AppError.js` | `class AppError extends Error` — has `statusCode` + `isOperational` |

---

## Backend — Validation Schemas (`schemas/index.js`)

Built with Zod. Applied to routes via `validate(schema)` middleware.

| Schema | Used in |
|--------|---------|
| `registerSchema` | Customer + admin register |
| `loginSchema` | Customer + admin login |
| `forgotPasswordSchema` | Forgot password |
| `resetPasswordSchema` | Reset password |
| `blogSchema` | Blog create/update |
| `leadSchema` | Lead submit |
| `serviceSchema` | Service create/update |

---

## Database Models

### User
`name`, `email`, `password`, `role` (admin/user/builder), `permissions[]`, `package` (starter/pro), `stripeCustomerId`, `passwordResetToken`, `passwordResetExpires`

### AdminUser
`name`, `email`, `password`

### Subscription
`userId` (ref User), `stripeCustomerId`, `stripeSubscriptionId`, `plan` (starter/pro), `status` (active/cancelled/past_due/trialing/incomplete), `currentPeriodStart`, `currentPeriodEnd`, `cancelAtPeriodEnd`

### WebhookEvent
`stripeEventId` (unique index), `type`, `processedAt` — prevents duplicate Stripe webhook processing

### BuilderProject
`userId` (ref User), `status` (empty/generating/ready), `prompt`, `businessName`, `slug` (auto-generated URL-safe), `tagline`, `primaryColor`, `package` (starter/pro), `pages[{id, name, slug, blocks[]}]`, `generatedAt`, `customDomain`, `customDomainVerified`, `customDomainToken`

### Blog
`title`, `content`, `thumbnail`, `fullImage`, `tags[]`, `featuredPages[]`, `comments[{text, replies[]}]`

### Project (Portfolio)
`title`, `image`, `shortDescription`, `description`, `buttonText`, `tags[]`, `videoUrl`, `blocks[]`

### Page (CMS)
`name`, `slug`, `description`, `seoTitle`, `seoDescription`, `keywords`, `ogTitle`, `ogDescription`, `ogImage`, `schema`, `robotsNoIndex`, `contentSections[]`

### Section
`name`, `key`, `page`, `title`, `shortDescription`, `description`, `image`, `featuredImage`, `accordion[]`, `button{}`, `order`, `enabled`, `blocks[]`

### Service
`slug`, `label`, `headline`, `description`, `longDescription`, `image`, `capabilities[]`, `process[{step, title, body}]`, `packages[{name, price, period, tagline, features[], popular}]`

### Lead
`name`, `email`, `phone`, `service`, `message`, `status` (new/contacted/closed)

### Menu
`title`, `url`, `order`, `children[]` (recursive)

### Footer
`sitemapLinks[]`, `servicesLinks[]`, `socialLinks[]`, `phone`, `email`, `address`, `companyName`, `craftingText`, `privacyPolicyUrl`, `copyrightText`

---

## Frontend — `lib/api.ts`

All frontend files use this instead of hardcoding URLs.

```ts
import { API, apiUrl, apiFetch, imgUrl } from "@/lib/api"

fetch(`${API}/api/blogs`)                // base URL from NEXT_PUBLIC_API_URL
apiUrl("/api/blogs")                     // → "http://localhost:8000/api/blogs"
const data = await apiFetch("/api/blogs") // fetch + throws on !ok
<img src={imgUrl(post.thumbnail)} />     // handles relative (Multer) and absolute (Cloudinary) paths
```

---

## Frontend — `middleware.ts`

Handles subdomain routing + admin auth guard in one file.

```
slug.yourdomain.com      →  internal rewrite to /site/slug
customdomain.com         →  internal rewrite to /site/domain/customdomain.com
/admin (no cookie)       →  redirect to /admin/login
/admin/login (has cookie) →  redirect to /admin
```

Set `NEXT_PUBLIC_ROOT_DOMAIN=yourdomain.com` in production. Dev defaults to `localhost:3000`.

---

## How the Homepage Works

1. Next.js server fetches `GET /api/pages/home`
2. Response includes `contentSections[]` — each has `blocks[]`, `enabled`, `order`
3. Sections filtered by `enabled: true`, sorted by `order`
4. `<PageSections>` renders each; `<BlockRenderer>` renders individual blocks
5. SEO meta (title, OG, JSON-LD) built from CMS page data

---

## Stripe / Subscription Flow

```
1. /pricing → click "Buy"
2. POST /api/subscriptions/checkout  →  Stripe Checkout Session URL
3. User pays on Stripe hosted page
4. Stripe webhook → POST /api/subscriptions/webhook
5. WebhookEvent created (idempotency guard — duplicate events skipped)
6. Subscription doc created/updated in MongoDB
7. user.role = "builder", user.package = plan
8. sendPaymentConfirmation email sent
9. User lands on /checkout/success → /dashboard
```

Cancellation: webhook `customer.subscription.deleted` → sets `role = "user"`, sends cancel email.

---

## Website Builder — Editor Architecture

```
app/builder/
├── page.tsx                    Main SPA (~1400 lines)
├── hooks/
│   └── useHistory.ts           Undo/redo — past/present/future reducer
└── _components/
    ├── ComponentPicker.tsx     Block library — categories + live scaled thumbnails + search
    ├── PropertiesPanel.tsx     Style inspector — layout, typography, background, effects, cards
    ├── BlockPreview.tsx        Read-only render of blocks (used in canvas + thumbnails)
    ├── CanvasEditor.tsx        Visual row/column/element canvas editor
    ├── BlockEditorPanel.tsx    Content field editor per block type
    ├── NavItemsEditor.tsx      Inline nav menu item editor
    └── ExportModal.tsx         Export as HTML or Next.js zip
```

### Builder State — Undo / Redo

```
setBlocks(val | fn)  →  records to past[], clears future[]
resetBlocks(arr)     →  clears history entirely (used on page switch)
undo()               →  moves present → future[0], past[-1] → present
redo()               →  moves present → past[-1], future[0] → present
```

- History capped at 50 entries
- Auto-save runs every 30 seconds when `saved === false`

### Builder Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+S` | Save |
| `Ctrl+D` | Duplicate selected block |
| `Delete` | Delete selected block (when focus is on body) |
| `↑ / ↓` | Move selected block up / down |
| `Escape` | Deselect / close panel |
| `?` | Toggle keyboard shortcuts cheatsheet |

### AI Generation

- **Full site** — `POST /api/builder/generate` — Gemini generates all pages + blocks
- **Page blocks** — `POST /api/builder/generate-page` — Gemini adds blocks to current page
- **Single block** — `POST /api/builder/regenerate-block` — Gemini regenerates one block type
- All generation uses `GEMINI_API_KEY` (Google Gemini 2.5 Flash)

---

## Onboarding Wizard Flow (Phase 6)

When a user clicks "Build with AI" in the builder, they go through a 4-step wizard instead of a blank prompt box.

```
Step 1 — Business name
  "What's your business called?"
  → text input, Enter or Continue button

Step 2 — Business type
  "What type of business is it?"
  → clickable grid (Restaurant, Photography, Freelancer, etc.)
  → clicking a tile auto-advances

Step 3 — Description
  "Tell us about your business"
  → textarea with helpful placeholder, 20-char minimum

Step 4 — Color & theme
  "Pick a style"
  → 6 color palette swatches (Ocean, Forest, Sunset, Berry, Slate, Midnight)
  → 4 visual theme cards (Light, Dark, Vibrant, Minimal)
  → "Generate my website" builds prompt and kicks off generation
```

### Generation animation

While AI generates the site (`view === "generating"`):
- Cycling step messages ("Analysing your business…", "Crafting your hero…", etc.)
- Animated skeleton blocks (pulsing grey bars) show what's being built
- On completion → enters editor with `showWelcome = true`

### Welcome overlay (first-time view)

After first generation, the editor shows a full-screen overlay:
- ✨ "Your site is ready!" message
- "Start editing →" button (dismisses overlay)
- "Preview live site ↗" button (opens `/site/[id]` in new tab)
- After dismissing: a floating tooltip nudges user to "Click any block to edit it"
- Tooltip disappears on first block click (`hasClickedBlock` state)

### State variables added for onboarding

| State | Purpose |
|-------|---------|
| `wizardStep` (0–3) | Current step in the 4-step wizard |
| `wizardData` | Accumulated wizard answers (name, type, desc, color, theme) |
| `showWelcome` | True after first generation — shows welcome overlay |
| `hasClickedBlock` | True after first block click — hides tooltip |

## What Is Already Built

| Feature | Status |
|---------|--------|
| Public website + CMS | Done |
| Admin panel (all content types) | Done |
| Customer auth (login, register) | Done |
| Password reset (forgot + reset pages) | Done |
| Stripe subscriptions (checkout, portal, webhooks) | Done |
| Webhook idempotency (WebhookEvent model) | Done |
| Customer dashboard (sites, billing, profile, support) | Done |
| AI website builder (full site + per-page + per-block regen) | Done |
| 4-step onboarding wizard (name → type → desc → color/theme) | Done |
| Generation skeleton animation screen | Done |
| First-view welcome overlay + "click to edit" tooltip | Done |
| Builder undo/redo (50-step history) | Done |
| Builder auto-save (every 30s) | Done |
| Builder keyboard shortcuts | Done |
| Block library with search | Done |
| Drag-and-drop block reorder (dnd-kit) | Done |
| Properties panel (style inspector) | Done |
| Responsive preview (desktop / mobile toggle) | Done |
| Subdomain routing (slug.domain.com) | Done |
| Custom domain support (DNS TXT verification) | Done |
| Admin analytics (users, subs, sites counts) | Done |
| Admin builder sites view | Done |
| Email notifications (welcome, payment, cancel, reset) | Done |
| Input validation (Zod) on auth routes | Done |
| Global error handler | Done |
| Cloudinary uploads (env-gated, disk fallback) | Done |
| API URL env var (no more hardcoded localhost) | Done |

## What Still Needs Work

| Feature | Notes |
|---------|-------|
| Subdomain DNS setup | Needs wildcard `*.yourdomain.com` A record at your domain registrar |
| Cloudinary credentials | Add 3 env vars to `backend/.env` to activate |
| Stripe live keys | Replace `sk_test_` keys with live keys before launch |
| Custom domain SSL | Needs Caddy or nginx wildcard cert config on server |
| Export to production hosting | Export feature exists; hosting setup is manual |

---

## Environment Variables

```bash
# backend/.env
MONGO_URI=mongodb+srv://...
JWT_SECRET=your-secret
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PRO=price_...
APP_URL=http://localhost:3000          # frontend URL (used in email links)
SMTP_USER=you@gmail.com               # Gmail address
SMTP_PASS=xxxx xxxx xxxx xxxx         # Gmail App Password (not main password)
LEAD_NOTIFY_EMAIL=leads@yourdomain.com
GEMINI_API_KEY=AIza...
CLOUDINARY_CLOUD_NAME=               # leave empty to use local disk
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# frontend/.env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_ROOT_DOMAIN=localhost:3000  # change to yourdomain.com in prod
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
GEMINI_API_KEY=AIza...
```

---

## Running Locally

```bash
# Backend (port 8000)
cd backend && npm install && npm run dev

# Frontend (port 3000)
cd frontend && npm install && npm run dev
```

Default admin account seeded on startup: `admin@lhrweb.com` / `Admin@123`
