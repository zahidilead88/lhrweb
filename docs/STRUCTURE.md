# LHRWEB — Project Structure

A Lahore-based digital agency site that's also a SaaS platform: customers pay for a subscription and use an AI-powered visual builder to create their own websites.

> Companion docs: **`docs/STATUS.html`** — what's actually built vs. still open, verified against this codebase.
> **`docs/BLUEPRINT.md`** — what to build next, dependency-ordered.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| Backend | Express.js, MongoDB, Mongoose |
| Auth | JWT — two separate systems (platform users vs. admin panel) |
| Validation | Zod |
| AI | Google Gemini 2.5 Flash, via a dedicated service layer |
| Payments | Stripe (Checkout + Billing Portal + Webhooks) |
| Uploads | Multer → Cloudinary (or local disk fallback) |
| Canvas | react-rnd (free-canvas drag/resize), @dnd-kit (block reorder) |

---

## Top level

```
lhrweb/
├── backend/      Express API — see below
├── frontend/     Next.js app — public site, dashboard, admin, builder
├── docs/         STRUCTURE.md (this file) + STATUS.html
└── scripts/      migrateBuilderProjects.js — one-off data migration
```

---

## Backend (`backend/`)

```
app.js                  Server entry point
                         — CORS origin allowlist (own origin + root-domain subdomains +
                           verified custom domains, cached), middleware chain, route mounting

models/                 19 Mongoose models
  BuilderProject.js       the core document: pages[], elements[], classes, tokens,
                           components[], canvasState (frames), aiMemory
  User.js                 platform users (role: user | builder | admin)
  AdminUser.js             separate auth system for the admin panel
  Blog.js · Page.js · Section.js · Service.js · Menu.js · Footer.js · Lead.js
                         → public-site CMS content
  Product.js · Order.js · Cart.js · Collection.js
                         → commerce data layer (routes exist; no builder UI yet — see STATUS.html)
  CmsCollection.js · CmsEntry.js
                         → dynamic content collections (same — backend-only today)
  Subscription.js · WebhookEvent.js
                         → Stripe billing state + idempotent webhook log
  GenerationJob.js         tracks async AI site-generation jobs
  AiCallLog.js             per-call AI usage/quota logging

routes/                 24 route files, one per resource
  builder.js               largest — site CRUD, all AI endpoints, custom-domain routes,
                           page management, component save/load
  auth.js · adminAuth.js   two parallel auth flows
  blogs.js · pages.js · sections.js · services.js · menu.js · footer.js · leads.js
  commerce.js · cms.js     registered, but nothing in the builder frontend calls them yet
  subscriptions.js         Stripe checkout / portal / webhook
  export.js                V1 code export (HTML / Next.js / Laravel ZIP)
  upload.js                Multer → Cloudinary or disk

services/ai/             The AI engine — the most architecturally mature part of the backend
  index.js                 entry point / orchestration
  prompts/                 one file per operation (siteGenerate, sitePlan, sitePage,
                           elementsGenerate, elementEdit, blockRegenerate, rewriteContent,
                           generateSeo, suggestTheme, animateElement) + shared.js + registry index.js
  gemini.js                model call wrapper
  schemas.js · validate.js Zod schemas + output validation
  repair.js                repair loop for malformed model output
  postProcess.js           post-generation cleanup
  contextBuilder.js        assembles project context injected into prompts
  quota.js                 per-user AI usage quota
  breaker.js               circuit breaker for the model API
  siteJob.js                async site-generation job runner (backs GenerationJob)
  templates.js              starter/fallback content templates
  evals/                    fixtures.js + run.js — regression eval harness for prompts

middleware/
  auth.js                  JWT verification
  validate.js               Zod-schema request validation
  upload.js                 Multer config
  subscriptionCheck.js      gates builder access by subscription status
  errorHandler.js

generators/              V1 static-export targets — html.js · nextjs.js · laravel.js
lib/                     authUtils.js · email.js · AppError.js
tests/                   ai-pipeline.test.js
```

---

## Frontend (`frontend/`)

### App Router route groups (`app/`)

```
(frontend)/    Public marketing site — home, pricing, blog, services, projects,
               checkout, and /site/[projectId] (published customer sites render here)
(auth)/        Customer login / register / forgot-password / reset-password
(dashboard)/   Customer dashboard — manage sites, billing (Stripe portal)
admin/         Admin panel
  (auth)/        admin login/register
  (root)/         blog · pages · sections · services · menu · footer · leads · users · sites — CRUD screens
builder/       The visual builder SPA — see below
  preview/       standalone live-preview route
```

### The builder (`app/builder/`)

```
page.tsx              Single spine component (~3,000+ lines) — all state, save/AI/CRUD
                       orchestration, view-mode routing between Flow and Free canvases
ErrorBoundary.tsx

_components/          29 components across three overlapping systems that share
                       one ElementNode data model:

  Flow / V1 (block-based, legacy but still live)
    BlockPreview.tsx · BlockEditorPanel.tsx · PropertiesPanelV1.tsx
    ComponentPicker.tsx · CanvasEditor.tsx · NavItemsEditor.tsx

  Flow / V2 (element-tree canvas)
    IframeCanvas.tsx · LayersPanel.tsx · StylesPanel.tsx
    SelectionOverlay.tsx · PropertiesPanel/ (index.tsx · SpacingBox.tsx · MotionSection.tsx)

  Free canvas (Figma-style, infinite pan/zoom)
    FreeCanvas.tsx · FreeElement.tsx · Frame.tsx · FrameContent.tsx
    CanvasToolbar.tsx · CanvasLayersPanel.tsx · CanvasPropertiesPanel.tsx
    AlignToolbar.tsx · FramePropertiesPanel.tsx

  Shared across all three
    AddPanel.tsx · ElementPicker.tsx · ConvertModal.tsx · ExportModal.tsx
    ColorPicker.tsx · FontPicker.tsx · AiModals.tsx
```

### Shared libraries (`lib/`)

```
generateHTML.ts / generateCSS.ts / stylesToCSS.ts
                       The render pipeline — ElementNode[] → published HTML/CSS.
                       Everything in the builder ultimately compiles through here.

frameToElements.ts     Bridges the Free canvas (frames[]) to the publish pipeline
                       (page.elements[]) — the fix for the former "free-mode publishes
                       blank" issue. See STATUS.html for detail.

promotions.ts          "Convert to…" — Section / Hero / Navbar / Footer promotion logic

api.ts                 fetch wrapper — throws on missing NEXT_PUBLIC_API_URL in production
retry.ts               retry/backoff + AbortController-aware retry logic

builderComponents.ts · sectionRegistry.ts · parseFigmaClipboard.ts
```

### Other frontend directories

```
components/
  admin/               TopBar.tsx
  frontend/            Public-site components — Navbar, Footer, Header, LeadPopup,
                       PageSections, SectionRenderer, BlockRenderer, CTASection,
                       FaqAccordion, SmoothScroll, ThemeToggle, TunnelScroll(+Loader)
    blocks/              reusable content-block renderers
    project/             portfolio-project rendering
    sections/            individual public-site section components

services/              pageService.ts · sectionService.ts · userService.ts
                       (thin API-call wrappers for the public-site/admin CRUD screens)

store/                 Redux — store.ts · hooks.ts · ReduxProvider.tsx · leadsSlice.ts

types/                 builder.ts — the single source of truth for ElementNode,
                       BuilderProject, Frame, FreeLayout, and every builder-related type

middleware.ts          Next.js middleware — subdomain routing for published sites
                       (slug.domain.com) + custom-domain resolution
```

---

## How it fits together

**One data model, two editors, one renderer.** `ElementNode` (defined once in `types/builder.ts`) is produced by three different sources — the Flow block editor, the Free Figma-style canvas, and AI generation — and all three converge on the same `generateHTML`/`generateCSS` pipeline to produce the published site. `BuilderProject.pages[].elements[]` is the single field every path writes into before a site goes live; `canvasState.frames[]` is a parallel store that keeps the Free canvas editable, bridged to `elements[]` via `frameToElements.ts` on save.

**The AI engine is a real subsystem**, not a thin wrapper: prompt registry, Zod-validated output, a repair loop for malformed responses, per-user quotas, a circuit breaker, and an eval harness for catching prompt regressions — all in `backend/services/ai/`.

**Commerce and CMS are backend-complete, frontend-absent.** `Product`, `Order`, `Cart`, `Collection`, `CmsCollection`, `CmsEntry` models and their routes (`commerce.js`, `cms.js`) are real and registered, but nothing in the builder UI creates, manages, or binds to them yet — see `docs/STATUS.html` for the full gap breakdown.

**Custom domains work end-to-end on the backend** (set + DNS TXT verification) but have no frontend screen calling either route — a small, nearly-free fix flagged as high priority in `docs/STATUS.html`.
