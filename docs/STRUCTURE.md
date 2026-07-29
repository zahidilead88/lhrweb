# LHRWEB — Complete Project Reference

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
| Drag/Resize | react-rnd (free canvas), @dnd-kit (block reorder) |

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
| `POST /api/auth/register` | `routes/auth.js` | Customer register + sends welcome email |
| `POST /api/auth/login` | `routes/auth.js` | Customer login |
| `POST /api/admin/auth/register` | `routes/adminAuth.js` | Admin register |
| `POST /api/admin/auth/login` | `routes/adminAuth.js` | Admin login |
| `POST /api/auth/forgot-password` | `routes/auth.js` | Generate reset token + send email |
| `POST /api/auth/reset-password` | `routes/auth.js` | Validate token + update password |

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
| `GET /api/builder/projects` | `routes/builder.js` | User's own builder projects list |
| `GET /api/builder/project` | `routes/builder.js` | Single project (by `?projectId=` or latest) |
| `POST /api/builder/generate` | `routes/builder.js` | AI-generate full site (V1 blocks) with Gemini |
| `POST /api/builder/generate-page` | `routes/builder.js` | AI-generate 2–5 V1 blocks for current page |
| `POST /api/builder/regenerate-block` | `routes/builder.js` | AI-regenerate a single V1 block |
| `POST /api/builder/generate-elements` | `routes/builder.js` | AI-generate V2 ElementNode tree + StyleClass[] |
| `POST /api/builder/regenerate-element` | `routes/builder.js` | AI-regenerate a single V2 element subtree |
| `POST /api/builder/animate-element` | `routes/builder.js` | AI-generate AnimationConfig from plain English |
| `POST /api/builder/init-manual` | `routes/builder.js` | Create a blank site (no AI) |
| `PUT /api/builder/project/pages/:pageId` | `routes/builder.js` | Save page blocks + elements |
| `PATCH /api/builder/project/pages/:pageId` | `routes/builder.js` | Rename a page (name + slug) |
| `PUT /api/builder/project/classes` | `routes/builder.js` | Save named CSS classes array |
| `PUT /api/builder/project/tokens` | `routes/builder.js` | Save design tokens (colors, fonts, spacing) |
| `PUT /api/builder/project/settings` | `routes/builder.js` | Save project-level settings (canvasMode, canvasState/frames) |
| `POST /api/builder/project/pages` | `routes/builder.js` | Add a new page (Pro only, max 15) |
| `DELETE /api/builder/project/pages/:pageId` | `routes/builder.js` | Delete a page (Pro only) |
| `POST /api/builder/project/sections` | `routes/builder.js` | Upsert a saved section (from Convert button) |
| `DELETE /api/builder/project/sections/:sectionId` | `routes/builder.js` | Delete a saved section |
| `DELETE /api/builder/project/:projectId` | `routes/builder.js` | Delete an entire site |
| `GET /api/builder/public/:projectId` | `routes/builder.js` | Public preview by MongoDB `_id` (no auth, no status filter) |
| `GET /api/builder/by-slug/:slug` | `routes/builder.js` | Public: find published site by slug (status=ready) |
| `GET /api/builder/by-domain/:domain` | `routes/builder.js` | Public: find site by custom domain (verified=true) |
| `GET /api/builder/all` | `routes/builder.js` | Admin: all customer sites populated with user name/email |
| `GET /api/builder/analytics` | `routes/builder.js` | Admin: totalUsers, activeSubscriptions, newUsersThisMonth, totalSites, subsByPlan |
| `POST /api/builder/:id/custom-domain` | `routes/builder.js` | Set custom domain + generate DNS TXT verification token |
| `POST /api/builder/:id/verify-domain` | `routes/builder.js` | Check DNS TXT record via `dns.promises.resolveTxt` |

#### Builder Route Details

**`POST /generate`** — Requires `user.role === "builder"`. Body: `{ prompt, theme? }`. Prompt max 2000 chars.
1. Creates project with `status: "generating"` immediately.
2. Calls Gemini with theme guide (dark/light/bold/minimal) + content/styles schemas + package constraints (starter: hero/about/services/contact/cta/features; pro: all types).
3. On success: updates to `status: "ready"` with all parsed fields. On failure: sets `status: "empty"`.

**`POST /generate-elements`** — Body: `{ prompt, projectId? }`. Prompt max 3000 chars.
Sends a detailed prompt with 10 critical rules (unique IDs, container/leaf distinction, mobile overrides, class reuse).
Post-processes to deduplicate element IDs across the entire tree (recursive walk).
Returns `{ elements: [...], classes: [...] }`.

**`PUT /project/settings`** — Body: `{ canvasMode?, canvasState?, projectId? }`.
`canvasMode` must be `"flow"` or `"free"`. `canvasState` stores frames array + zoom + pan for the free canvas.

**`POST /project/sections`** — Body: `{ section: { id, name, html, css, thumbnail?, sourceFrameId? }, projectId? }`.
Upserts: replaces existing section with same `id`, otherwise appends.
The `id` format is typically `"sec_{frameId}_{timestamp}"`.

### Subscriptions
| Route | File | What it does |
|-------|------|-------------|
| `POST /api/subscriptions/checkout` | `routes/subscriptions.js` | Create Stripe Checkout Session |
| `POST /api/subscriptions/portal` | `routes/subscriptions.js` | Open Stripe Billing Portal |
| `GET /api/subscriptions/status` | `routes/subscriptions.js` | Current user's subscription |
| `POST /api/subscriptions/webhook` | `routes/subscriptions.js` | Stripe webhook (raw body, idempotent via WebhookEvent) |

### Export
| Route | File | What it does |
|-------|------|-------------|
| `POST /api/export/elements` | `routes/export.js` | Export V2 element tree as clean HTML + CSS zip (working) |
| `POST /api/export` | `routes/export.js` | Export V1 blocks as HTML / Next.js / Laravel zip (**broken** — see Known Issues) |

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

## Backend — `app.js` Startup Sequence

On every server start, `app.js` runs these one-time startup tasks:

1. Drops legacy unique indexes on `sections` collection (silently).
2. Drops legacy `userId_1` unique index on `builderprojects` (allows multiple projects per user).
3. Normalises all `pages` slugs (`"/"` → `"home"`, fixes `"/secvices"` typo) and title-cases names.
4. Ensures the 6 standard pages exist (Home, Services, Projects, About, Contact, Blog).
5. **Upserts `admin@lhrweb.com` with password `Admin@123` on every boot** — this means changing the admin password does not persist across restarts.
6. Seeds 2 demo services (`web-design`, `web-development`) if absent.
7. Migrates old sections format.

### AI Rate Limiter
Applied individually to all 6 AI endpoints before the builder router:
- Window: 60 seconds
- Max: 5 requests per IP
- Returns: `{ message: "Too many AI generation requests. Please wait before trying again." }`

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
`userId` (ref User), `status` (empty/generating/ready), `prompt`, `businessName`, `slug` (auto-generated URL-safe, indexed), `tagline`, `primaryColor`, `package` (starter/pro), `canvasMode` (flow/free — default "flow"), `pages[{id, name, slug, blocks[], elements[]}]`, `classes[{name, styles{desktop,tablet?,mobile?}}]`, `tokens{colors[], fonts[], spacing{}}`, `savedSections[{id, name, html, css, thumbnail?, sourceFrameId?, createdAt}]`, `canvasState` (Mixed — stores frames[], zoom, panX, panY), `generatedAt`, `customDomain` (sparse index), `customDomainVerified`, `customDomainToken`

> **`canvasState` field**: Stores the entire free canvas viewport state serialized as JSON: frames (positions, sizes, children), zoom level, pan offset. Saved on every `PUT /project/settings` call from the builder. The `frames` array in `canvasState` is the authoritative store for Figma-style frames.

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

## Frontend — Builder Types (`types/builder.ts`)

### `Styles` interface
Full CSS property map (camelCase, all optional). Covers:
- **Layout**: `display`, `flexDirection`, `flexWrap`, `alignItems`, `alignSelf`, `justifySelf`, `justifyContent`, `flex`, `flexGrow`, `flexShrink`, `flexBasis`, `gap`, `rowGap`, `columnGap`, `gridTemplateColumns`, `gridTemplateRows`, `gridColumn`, `gridRow`
- **Size**: `width`, `height`, `minWidth`, `maxWidth`, `minHeight`, `maxHeight`
- **Spacing**: `margin*` (4 sides), `padding*` (4 sides)
- **Typography**: `fontFamily`, `fontSize`, `fontWeight`, `fontStyle`, `lineHeight`, `letterSpacing`, `wordSpacing`, `textAlign`, `textDecoration`, `textTransform`, `color`, `whiteSpace`, `wordBreak`
- **Background**: `backgroundColor`, `backgroundImage`, `backgroundSize`, `backgroundPosition`, `backgroundRepeat`, `backgroundAttachment`
- **Border**: all sides + `borderRadius` + per-corner radii
- **Effects**: `opacity`, `boxShadow`, `textShadow`, `filter`, `backdropFilter`
- **Position**: `position`, `top`, `right`, `bottom`, `left`, `zIndex`
- **Overflow**: `overflow`, `overflowX`, `overflowY`
- **Transform/Animation**: `transform`, `transition`, `animation`
- **Other**: `cursor`, `pointerEvents`, `userSelect`, `visibility`, `objectFit`, `objectPosition`, `listStyle`, `outline`, `resize`, `aspectRatio`, `appearance`

### `HTMLTag` (union type)
All allowed tags: div, section, article, aside, main, nav, header, footer, h1–h6, p, span, a, strong, em, blockquote, img, video, button, input, textarea, select, form, label, ul, ol, li, table, thead, tbody, tr, th, td, svg

### `ElementNode` interface
Recursive tree node:
```typescript
{
  id: string
  tag: HTMLTag
  label?: string                // display name for groups in LayersPanel
  className?: string            // named class from project.classes[]
  content?: string              // text for leaf nodes
  attrs?: Record<string, string> // href, src, alt, placeholder, type…
  styles: { desktop: Styles; tablet?: Partial<Styles>; mobile?: Partial<Styles> }
  children: ElementNode[]
  animation?: AnimationConfig   // entrance/scroll/hover/press animation
  layout?: FreeLayout           // free canvas: x, y, width, height, rotation, zIndex
}
```

### `FreeLayout` interface
Free-canvas element position: `x`, `y`, `width`, `height?`, `rotation?`, `zIndex?`

### `Frame` interface
Figma artboard: `id`, `name`, `canvasX`, `canvasY`, `width`, `height`, `background` (CSS color), `clipContent` (boolean), `children: ElementNode[]`

### `FRAME_PRESETS` constant
Four preset sizes: Desktop (1440×900), Laptop (1280×800), Tablet (768×1024), Mobile (390×844)

### `CanvasTool` (union type)
`"move" | "hand" | "frame" | "rect" | "ellipse" | "text"`

### `CanvasState` interface
`frames: Frame[]`, `zoom: number`, `panX: number`, `panY: number`, `selectedFrameId: string | null`, `selectedElementIds: string[]`, `activeTool: CanvasTool`

### `SavedSection` interface
Output of the Convert button: `id`, `name`, `html`, `css`, `thumbnail?` (base64), `createdAt`, `sourceFrameId?`, `frameWidth?`, `frameHeight?`

### `StyleClass` interface
Named reusable CSS class: `name`, `styles: { desktop: Styles; tablet?: ...; mobile?: ... }`

### `ColorToken` / `FontToken` / `SiteTokens`
- `ColorToken`: `{ name: string; value: string }` (e.g. `{ name: "brand", value: "#6344d4" }`)
- `FontToken`: `{ name: string; family: string }`
- `SiteTokens`: `{ colors: ColorToken[]; fonts: FontToken[]; spacing: Record<string,string> }`

### `AnimationConfig` interface
`preset?`, `initial?`, `animate?`, `whileInView?`, `viewport?: { once?, amount? }`, `exit?`, `whileHover?`, `whileTap?`, `transition?: TransitionConfig`, `staggerChildren?`

### `TransitionConfig` interface
`type?: "tween" | "spring"`, `duration?`, `delay?`, `ease?`

### `AnimationProps` interface
`opacity?`, `x?`, `y?`, `scale?`, `rotate?`

---

## Frontend — `lib/`

### `lib/api.ts`
All frontend files use this instead of hardcoding URLs.
```ts
import { API, apiUrl, apiFetch, imgUrl } from "@/lib/api"

fetch(`${API}/api/blogs`)                // base URL from NEXT_PUBLIC_API_URL
apiUrl("/api/blogs")                     // → "http://localhost:8000/api/blogs"
const data = await apiFetch("/api/blogs") // fetch + throws on !ok
<img src={imgUrl(post.thumbnail)} />     // handles relative (Multer) and absolute (Cloudinary) paths
```

### `lib/stylesToCSS.ts`
Converts a `Styles` object to a CSS declaration string.
- `camelToKebab()` converts property names (e.g. `backgroundColor` → `background-color`)
- `addUnit()` appends `px` to bare numbers; `UNITLESS` set skips `opacity`, `zIndex`, `fontWeight`, `lineHeight`, `flex`, `flexGrow`, `flexShrink`, `order`
- Example: `{ paddingTop: "40px", color: "#fff" }` → `"padding-top: 40px; color: #fff"`

### `lib/generateCSS.ts`
`generateCSS(elements, classes?, tokens?): string`

Produces a complete CSS string in three layers (specificity order):
1. **`:root { --color-*, --font-*, --space-* }`** — from `SiteTokens`
2. **`.className { ... }`** + tablet/mobile `@media` overrides — from `StyleClass[]`
3. **`[data-id="..."] { ... }`** + tablet/mobile `@media` overrides — from recursive walk of `ElementNode[]`

Breakpoints: tablet = `max-width: 991px`, mobile = `max-width: 479px`.

### `lib/generateHTML.ts`
`generateHTML(elements): string`

Recursively serializes an `ElementNode[]` tree to HTML:
- Every node gets `data-id`, `class`, and `data-animate` (JSON AnimationConfig) attributes
- Void tags (`img`, `input`, `br`, `hr`, etc.) are self-closing
- Non-void with children → recurse; without children → render `el.content` as escaped text
- Root elements with a `label` get an absolutely-positioned purple badge overlay

### `lib/builderComponents.ts`
V1 block type definitions, field specs, and default content/styles for each block type.

---

## Frontend — `middleware.ts`

Handles subdomain routing + admin auth guard:
```
slug.yourdomain.com      →  internal rewrite to /site/slug
customdomain.com         →  internal rewrite to /site/domain/customdomain.com
/admin (no cookie)       →  redirect to /admin/login
/admin/login (has cookie) →  redirect to /admin
```
Set `NEXT_PUBLIC_ROOT_DOMAIN=yourdomain.com` in production. Dev defaults to `localhost:3000`.

---

## Website Builder — Complete Architecture

### Directory Structure
```
app/builder/
├── page.tsx                        Main SPA (~2200 lines) — all state + routing
├── ErrorBoundary.tsx
├── hooks/
│   └── useHistory.ts               Generic typed undo/redo hook (defined but not used by page.tsx)
└── _components/
    │
    ├── ── V1 BLOCK BUILDER ──────────────────────────────────────
    ├── ComponentPicker.tsx          V1 block library — categories + scaled thumbnails + search
    ├── BlockPreview.tsx             V1 read-only render (canvas + thumbnails + flow mode preview)
    ├── BlockEditorPanel.tsx         V1 content field editor per block type
    ├── CanvasEditor.tsx             V1 visual row/column/element canvas editor
    ├── NavItemsEditor.tsx           V1 inline nav menu item editor
    ├── PropertiesPanelV1.tsx        V1 block style inspector (padding, bg, typography, effects)
    │
    ├── ── V2 IFRAME CANVAS ──────────────────────────────────────
    ├── IframeCanvas.tsx             srcDoc iframe + postMessage selection + drag/reparent + animation runtime
    ├── LayersPanel.tsx              Element tree inspector — expand/collapse, DnD reorder, context menu
    ├── StylesPanel.tsx              Design tokens (colors/fonts/spacing) + named CSS classes editor
    ├── SelectionOverlay.tsx         Portal-based resize/move handles over the iframe canvas
    │
    ├── ── FREE CANVAS (FIGMA-LIKE) ──────────────────────────────
    ├── FreeCanvas.tsx               Infinite pan/zoom canvas with react-rnd, rulers, snap guides
    ├── FreeElement.tsx              Recursive DOM element renderer (no iframe)
    ├── Frame.tsx                    Single artboard — drag from label, resize from corner handle
    ├── FrameContent.tsx             Elements inside a frame — react-rnd, rubber-band select, handles
    ├── CanvasToolbar.tsx            Top bar — tool palette, frame presets dropdown, save status
    ├── CanvasLayersPanel.tsx        Left panel — frame tree + free elements, reorder, rename, delete
    ├── CanvasPropertiesPanel.tsx    Right panel — Figma-style position/layout/style inspector
    ├── AlignToolbar.tsx             Multi-select align/distribute floating toolbar
    │
    ├── ── SHARED / OVERLAPPING ──────────────────────────────────
    ├── AddPanel.tsx                 4-tab drawer: Elements / Sections / AI Generate / My Designs
    ├── ElementPicker.tsx            Older single-purpose element drawer (superseded by AddPanel)
    ├── ConvertModal.tsx             Convert a frame to a saved design (HTML+CSS export + API save)
    ├── ExportModal.tsx              Download as ZIP — V2 clean HTML/CSS or V1 framework stacks
    │
    └── PropertiesPanel/
        ├── index.tsx                V2 style inspector — 8 sections, breakpoint tabs, class selector
        ├── SpacingBox.tsx           Visual margin/padding box editor (like DevTools box model)
        └── MotionSection.tsx        Animation presets, scroll trigger, timing, hover/press, AI assist
```

---

## Builder — Two Canvas Modes

### Flow Mode (default)
V1 blocks or V2 element tree rendered inside a `srcDoc` iframe. Block-based layout, sections stacked vertically. Uses `IframeCanvas` for V2 element rendering.

### Free Mode (Figma-like)
V2 element tree rendered directly in the React DOM via `react-rnd`. Infinite pan/zoom canvas, free-placement drag/resize, snap guides, multi-select, Figma-style frames (artboards).

**Architecture: Free Mode has two tiers of elements**
1. **Frames** — artboard containers. Managed by `page.tsx` `frames` state, rendered by `<Frame>` + `<FrameContent>`.
2. **Free elements** — not inside any frame. Managed by `page.tsx` `elements` state, rendered inside `FreeCanvas` with `react-rnd`.

---

## Builder — State Variables (`page.tsx`)

### View State Machine
`view: "loading" | "no-auth" | "choose" | "prompt" | "wizard" | "generating" | "manual-setup" | "editor"`

### Auth / Package
| Variable | Controls |
|---|---|
| `token: string` | Bearer token for all API calls |
| `pkg: string` | `"starter"` or `"pro"` — gates multi-page features |
| `project: Project \| null` | Full project object from server |

### Wizard / Prompt
| Variable | Controls |
|---|---|
| `prompt: string` | Raw AI prompt text (legacy prompt view) |
| `aiTheme: "dark"\|"light"\|"bold"\|"minimal"` | Visual theme for AI generation |
| `wizardStep: number` | Current step 0–3 in 4-step onboarding wizard |
| `wizardData: WizardData` | Accumulated wizard inputs (name, type, description, color, theme) |
| `msgIdx: number` | Index into `LOADING_MSGS` array rotating during generation animation |

### Block History (Flow Mode)
| Variable | Controls |
|---|---|
| `blocks / setBlocksRaw` | V1 block list for current page |
| `past: Block[][]` | Undo stack (max 50 entries) |
| `future: Block[][]` | Redo stack |
| `lastHistoryTime: ref` | Debounce timestamp — rapid edits within 1.5s collapse into one history entry |

### Editor / UI
| Variable | Controls |
|---|---|
| `selectedId` | Currently selected page ID in page switcher |
| `saving / saved` | Save status — saved resets to false after 2.5s |
| `showExport` | Export modal visibility |
| `addPanelTab` | Default tab when Add panel opens (`"elements" \| "sections" \| "ai"`) |
| `showAddPage / newPageName` | Inline add-page input |
| `renamingPageId / renameInput` | Page rename mode |
| `showPageDropdown` | Page switcher dropdown |
| `previewMode` | `"none" \| "split" \| "full"` — top bar mode switcher |
| `editingBlockId` | Which block in sidebar is selected/expanded |
| `activeDragId` | Block being dragged in dnd-kit |
| `previewDevice` | `"desktop" \| "mobile"` — device preview icon |
| `activeTab` | Active left-panel tab: `"ai" \| "design" \| "layers" \| "styles" \| "add" \| "assets" \| null` |
| `panelDragType` | Element type being dragged from Add panel |
| `saveModal / saveName` | Save-as-template modal |
| `regenBlockId` | Block currently being AI-regenerated (shows spinner) |
| `showShortcutsModal` | Keyboard shortcuts cheatsheet |
| `showWelcome` | Post-generation welcome overlay |
| `hasClickedBlock` | First-click tracking for onboarding hint |

### V2 / Element Tree
| Variable | Controls |
|---|---|
| `elements: ElementNode[]` | Element tree for the current page (flow + free mode) |
| `selectedElementId` | Selected element in iframe/V2 canvas |
| `canvasViewport` | `"desktop" \| "tablet" \| "mobile"` — 3-button viewport switcher |
| `classes: StyleClass[]` | Named CSS classes shared across the project |
| `tokens: SiteTokens` | Design tokens (colors, fonts, spacing) |
| `canvasMode` | `"flow" \| "free"` — which canvas type is active |

### Free Canvas — Frames
| Variable | Controls |
|---|---|
| `frames: Frame[]` | All Figma-style artboards on the canvas |
| `selectedFrameId` | Which frame is focused |
| `canvasZoom` | Current zoom level (default 0.75) |
| `activeTool: CanvasTool` | Active tool: move/hand/frame/rect/text/ellipse |
| `selectedFrameElementIds: string[]` | Multi-selected element IDs inside a frame |

### Saved Sections
| Variable | Controls |
|---|---|
| `savedSections: SavedSection[]` | Designs created from Convert button |
| `convertingFrame: Frame \| null` | Frame currently being converted (shows ConvertModal) |

---

## Builder — Major Functions (`page.tsx`)

### Save / Persist
- **`handleSave()`** — PUTs blocks+elements to `/api/builder/project/pages/:id`, then PUTs classes, tokens, and settings (`canvasMode` + `canvasState` = serialized frames) in parallel.
- Auto-save: `setInterval` every 30s calls `handleSave()` only when `!saved`.
- `beforeunload` warns of unsaved changes.

### AI Generation
- **`handleGenerate()`** — full website from legacy prompt view; calls `/api/builder/generate`.
- **`advanceWizard(patch)`** — 4-step wizard; on step 3 builds the prompt and calls `/api/builder/generate`.
- **`handleManualInit()`** — POSTs to `/api/builder/init-manual` with name/tagline/color.
- **`handleAiGenerate()`** — in-editor chat; calls `/api/builder/generate-elements` (V2) or `/api/builder/generate-page` (V1 blocks).
- **`handleAddPanelGenerate(prompt)`** — same as above, called from AddPanel AI tab.
- **`handleRegenBlock(blockId)`** — regenerates one block via `/api/builder/regenerate-block`.

### Block Management
- **`setBlocks(valOrFn)`** — custom setter that pushes to undo history (1.5s debounce, max 50 entries).
- **`resetBlocks(newBlocks)`** — sets blocks without history (page switches). Strips `canvas`-type blocks.
- **`undo() / redo()`** — traverse `past`/`future` stacks.
- **`deleteBlock(id)`** — guards against deleting the last block; calls `confirm()`.
- **`moveBlock(id, dir)`** — swaps with neighbour.
- **`handleAddComponent(comp)`** — appends a new block from a `ComponentDef`.
- **`handleDragStart/End`** — dnd-kit drag handlers using `arrayMove`.

### Page CRUD
- **`handleAddPage()`** — POSTs to `/api/builder/project/pages`, enters editor on new page.
- **`handleDeletePage(pageId)`** — DELETEs page (Pro only, must have >1 page).
- **`handleRenamePage(pageId, name)`** — PATCHes page name.

### Frame Management (Free Mode)
- **`handleAddFrame(x, y, w, h)`** — creates frame from drag-to-draw; tries to match preset by dimensions.
- **`handleNewFrameFromPreset(preset)`** — places new frame to the right of all existing frames.
- **`handleRenameFrame / handleResizeFrame / handleMoveFrame / handleDeleteFrame`** — immutable frame updates via `setFrames`.
- **`handleUpdateFrameChildren(frameId, children)`** — replaces children of a frame.
- **`handleFrameChildLayoutChange / ContentChange`** — updates position or content of a specific child.
- **`handleUseDesign(section)`** — places a saved design as a new frame, deep-cloning element tree with fresh IDs.
- **`deepCloneWithNewIds(els)`** — recursive deep clone that regenerates all element IDs.
- **`findFrameAtPoint(wx, wy)`** — hit-tests frames in reverse Z order.

### Convert Flow → Free
- The "Customize" (wand) button on a `SectionRow` calls `blockToElements(block)`, appends results to `elements`, removes the block from `blocks`, switches to free mode.
- **`blockToElements(block)`** — converts a Block's content fields into a `section > [h2|p, grid > [card, ...]]` ElementNode tree with inline styles.

### Element Tree Helpers (module-level pure functions)
- `findElementById`, `deleteFromTree`, `addChildInTree`, `tryInsertNear`, `insertElementNear` — recursive tree operations
- `updateElementInTree(elements, id, updater)` — generic tree updater
- `updateElementContent`, `updateElementStyle`, `updateElementLayout` — specialised wrappers
- `saveSection(block, name)` / `saveElementComponent(el, name)` — persist to `localStorage`

---

## Builder — Component Reference

### `page.tsx` — Render Tree (editor view)
```
h-screen flex flex-col
├── <header> (top bar, h-12)
│   ├── Logo + page dropdown + unsaved dot
│   ├── Undo/Redo + viewport switcher (desktop/tablet/mobile)
│   ├── Flow/Free mode toggle
│   └── Preview + Export + Publish + Dashboard + Logout
│
└── flex flex-1 overflow-hidden
    ├── [flow mode] Left Icon Rail (w-14) — Add/AI/Layers/Design/Styles icons
    ├── [flow mode] Left Panel (w-300) — conditionally renders:
    │   ├── activeTab==="ai"     → AI chat panel with quick-prompt buttons
    │   ├── activeTab==="design" → DnD-sorted SectionRow list
    │   ├── activeTab==="layers" → SectionRow list
    │   ├── activeTab==="styles" → <StylesPanel>
    │   └── activeTab==="add"   → <AddPanel>
    │
    ├── [free mode] Left Panel (w-240) — Figma-style:
    │   ├── Pages section
    │   ├── Tab bar: Layers / Elements / Assets
    │   ├── [layers] <CanvasLayersPanel>
    │   ├── [add]    <AddPanel>
    │   └── [assets] placeholder
    │
    ├── Main canvas area (flex-1)
    │   ├── [flow] <BlockPreview> in scrollable container
    │   └── [free] <FreeCanvas> with frameChildren=<Frame>+<FrameContent> nodes
    │
    └── Right panel (conditionally rendered)
        ├── [flow, block selected] <BlockEditorPanel> + <PropertiesPanelV1>
        ├── [free, element selected] <CanvasPropertiesPanel>
        └── [free, frame selected]  <CanvasPropertiesPanel> (frame variant)
```

---

### `FreeCanvas.tsx`

Infinite pan/zoom canvas. Manages its own viewport (scale, offset) internally — parent only receives viewport changes via callback.

**Key constants**: `MIN_SCALE=0.05`, `MAX_SCALE=8`, `RULER_SZ=20`, `SNAP_PX=5` (snap guide threshold), `BRAND="#7B6EF5"`, `CANVAS_BG="#EAEAEA"`, `GRID_SIZE=40`

**Internal state**: `scale` (zoom, default 0.5), `offset` (pan), `showGrid`, `guides` (snap lines), `rb` (rubber-band rect), `drawShape` (draw-tool preview), `elDragInfo` (live drag label), `editingId/editingText` (inline text edit), `ctxMenu` (context menu position)

**Exported helpers**: `screenToWorld(sx, sy, offsetX, offsetY, scale)`, `worldToScreen(wx, wy, ...)`

**Free element Rnd** — each element gets:
- `scale={scale}` prop so react-rnd compensates for CSS transform (without this, drag is 2× too fast at 50% zoom)
- `handleStyles = makeElementHandles(scale)` — CSS size = `8/scale px` so handles are always ~8 screen pixels
- Scale-invariant selection border: `border: ${1.5/scale}px solid BRAND`
- Live drag label: `"x, y — w × h"` floating below element during drag/resize

**Bottom floating toolbar**: tools, zoom controls (fit/100%/in/out), grid toggle, alignment buttons (≥2 selected), save status.

**Keyboard shortcuts**: V=move, H=hand, A=frame, R=rect, T=text, Esc=deselect, ⌘0=fit, ⌘1=100%, ⌘+/-=zoom, ⌘A=selectAll, Del=delete, ⌘D=duplicate, ⌘C/V=copy/paste, ⌘Z=undo, [/]=z-order, arrows=nudge

---

### `Frame.tsx`

Single artboard rendered on the free canvas. Positioned absolutely at `(canvasX, canvasY)` in world coordinates.

**Label drag**: `handleLabelMouseDown` attaches global mouse listeners; on mousemove: `onMove(fx + (clientX-sx)/scale, fy + (clientY-sy)/scale)`.

**Corner resize**: `ResizeHandle` sub-component at `bottom-right: (-5, -5)`. Min 100×100px. Computes `onResize(max(100, sw+dx/scale), max(100, sh+dy/scale))`.

**Inline rename**: double-click label → `<input>` with autoFocus+selectAll; Enter/blur commits, Escape cancels.

---

### `FrameContent.tsx`

Interactive element layer inside a frame. All interaction via `react-rnd`.

**`makeHandleStyles(scale)`** — scale-invariant handles: `s = max(6, 8/scale)` CSS px; border `b = max(1, 1.5/scale)` px. Handles appear constant 8px regardless of zoom.

**Rubber-band selection**: fires only on empty frame body clicks (`e.target === e.currentTarget`). Selects all elements whose bounding boxes intersect by >5px.

**Live drag label**: `"x, y — w × h"` shown at `bottom: -22/scale px` below element while dragging or resizing.

**Multi-select bounding box**: dashed purple rect wrapping all selected elements (zIndex 201).

**Keyboard shortcuts**: Escape=deselect, ⌘A=selectAll, Del=delete, Arrows=nudge 1px, Shift+Arrows=10px.

---

### `CanvasPropertiesPanel.tsx`

Figma-style right panel for free canvas elements. Style token: `BRAND="#7B6EF5"`.

**Props**: `element`, `breakpoint`, `onStyleChange`, `onContentChange?`, `layout?: {x,y,width,height}`, `onLayoutChange?`

**`PrefixInput` component** — controlled input that prevents flicker during drag updates:
- Local state + `useRef(false)` focus flag
- Syncs from parent only when not focused (external drag updates)
- Commits rounded integer on blur; reverts on invalid

**`isText` / `isCont` / `isFlex` / `isGrid`** — tag-type helpers that show/hide sections.

**8 Sections**:
1. **Position** — 6 self-alignment buttons (justifySelf + alignSelf), X/Y position inputs, rotation, Flip H/V, Reset transform
2. **Layout** — Resizing mode (auto/fixed/wrap for text), W/H inputs with aspect-lock, Display selector, Flex/Grid sub-controls, Padding (T/R/B/L)
3. **Appearance** — Opacity %, Border radius
4. **Typography** (text elements only) — Content textarea, Font family/weight/size, Line height, Letter spacing, Text alignment (H+V+Justify), Style toggles (italic/bold/underline/uppercase), Color
5. **Fill** — BG color swatch + hex + opacity % + eye + minus
6. **Stroke** — Border color/width/style
7. **Effects** — Box shadow raw CSS input
8. **Export** — Stub (header only)

**Font options** (`WEB_FONTS`): Inter, Roboto, Poppins, Open Sans, Montserrat, Lato, Nunito, Raleway, Merriweather, Playfair Display, Source Code Pro, Ubuntu, Oswald, PT Serif, Libre Baskerville, system-ui

**Weight labels** (`WEIGHT_LABELS`): 100=Thin, 200=ExtraLight, 300=Light, 400=Regular, 500=Medium, 600=SemiBold, 700=Bold, 800=ExtraBold, 900=Black

---

### `CanvasToolbar.tsx`

Top bar for the free canvas. Dark theme (`#1A1A2E`).

**Tools**: Move (V), Frame (F), Rect (R), Ellipse (O), Text (T), Hand (H) — keyboard shortcut shown as 8px monospace badge.

**Frame preset dropdown**: Opens on "New Frame" button click; shows preset label + `{width}×{height}` pairs from `FRAME_PRESETS`.

**Save status**: amber dot=saving, green=saved, dim=unsaved.

---

### `CanvasLayersPanel.tsx`

Left panel for the free canvas. Shows all frames (collapsible, with children) and free elements.

**`FrameRow`** — shows `name [width×height]`, inline rename on double-click, hover reveals ↑↓ reorder and 🗑 delete. Children shown when expanded.

**`ElementRow` / `FreeElementRow`** — shows tag + first 24 chars of `el.content`.

**`TagIcon`** — maps HTML tags to Lucide icons: Type (headings), AlignLeft (p/span), Img (img), Link (a), List (ul/ol), Layout (section/article), Box (default).

---

### `AddPanel.tsx`

Primary left-side drawer with 4 tabs.

**Tab: Elements**
- 16 element types in 4 categories (Layout/Typography/Media/Interactive)
- Each tile is `draggable` — sets `dataTransfer` to element type for drop-to-canvas
- Elements with variants (heading H1-H4, grid 2/3/4-col, button filled/outline/ghost) show inline variant picker
- Saved elements section (from `localStorage["lhrweb_saved_elements"]`) with delete

**Tab: Sections**
- Pre-built `ComponentDef` blocks organized by category
- Scaled `BlockPreview` thumbnail (316/1280 scale)
- Click-to-preview modal at 820px; "Add to page" button

**Tab: AI Generate**
- Textarea with 6 suggestion chips
- Calls `onAiGenerate(prompt)` async; shows "Generating…" → "Added to page ✓"

**Tab: My Designs**
- Shows `SavedSection[]` passed from parent
- Each card has a scaled `<iframe srcDoc>` preview
- Actions: Copy HTML, Copy CSS, Use (calls `onUseDesign`)

**`createElement(type)` factory** — produces fully-configured `ElementNode` with default styles for all 16 types. Notable defaults:
- `div/section`: 400×200px, white bg
- `flex`: row, gap 16px, white bg
- `heading`: 48px, 700w, `#1a1a2a`
- `button`: purple bg (#6344d4), white text, 12px radius, px-24/py-12
- `form`: stack of label+input rows
- `grid`: CSS grid with 3 columns, gap 20px

---

### `AlignToolbar.tsx`

Floating pill showing selection count + 8 alignment buttons + deselect. Renders only when `selectedCount >= 2`.

**`applyAlignment(elements, ids, alignment)` (exported)**

Operates on the full `ElementNode[]` array, mutates only selected IDs:
- `left` / `centerH` / `right` — align to bounding box left/center/right
- `top` / `centerV` / `bottom` — align to bounding box top/center/bottom
- `distH` — sort by X, distribute with equal gaps
- `distV` — sort by Y, distribute with equal gaps

Returns new array (immutable).

---

### `ConvertModal.tsx`

Modal for converting a canvas frame to a saved design.

**Flow**:
1. `html = generateHTML(frame.children)` + `css = generateCSS(frame.children, classes, tokens)` — computed via `useMemo`
2. Shows stats grid: element count, HTML size (KB), CSS size (KB)
3. Collapsible `CodeBlock` previews for HTML and CSS
4. "Save Design" → POSTs to `POST /api/builder/project/sections`, then calls `onSaved(section)`, closes after 1.2s

**`SavedSection` ID format**: `"sec_{frameId}_{Date.now()}"` — uniquely identifies this version of the section.

---

### `BlockPreview.tsx`

Renders a list of flow-mode `Block` objects as a visible page.

**Block types rendered** (21 total): `header`, `hero`, `about`, `statement`, `whyus`, `features`, `services`, `testimonials`, `team`, `gallery`, `pricing`, `faq`, `cta`, `contact`, `footer`, `process`, `stats`, `custom`, `canvas`, `html`

**`canvas` type** — renders a grid-of-rows layout via `CanvasBlock` / `renderCanvasEl`; supports: heading, text, button, image, list, divider, spacer, div

**`html` type** — renders raw HTML/CSS in sandboxed `<iframe srcDoc>` with auto-height via `onLoad`

**`EditableText`** — `contentEditable` span; Enter commits, Shift+Enter newline. In read-only context (no callbacks) renders as plain `<span>`.

**Style helpers** (all derived from `block.styles: BlockStyles`):
- `pyClass`, `mwClass`, `hSizeClass` — Tailwind classes
- `sectionStyle`, `sectionTailwindClasses` — inline style + class for bg/shadow/border
- `btnStyle`, `btnSzClass` — button appearance
- `cardRadiusClass`, `cardShadowClass`, `cardBgStyle` — card appearance
- `gridClass`, `fontClass`, `contentAlignCls`
- `accentColor`, `hStyle`, `bStyle`

**`SelectableBlock` wrapper** — adds `ring-2` selection outline, type badge, "Click to style" indicator, fires `onSelectBlock(id, "layout")`.

---

### `PropertiesPanelV1.tsx`

Right-side style inspector for V1 blocks. Controls block-level visual properties via 6 accordion sections.

**6 Sections**:
1. **Layout & Canvas** — Vertical Padding (XS/S/M/L/XL), Max Container Width (SM/MD/LG/XL/Full), Grid Columns (2/3/4 — for grid blocks)
2. **Typography & Font Colors** — Heading color, Heading size, Body color, Headline alignment (L/C/R), Font family (Sans/Serif/Mono)
3. **Accents & Buttons** — Accent palette color, Button style (Solid/Outline/Ghost), Button radius (Sharp/Sleek/Pill)
4. **Background & Image** — Section BG color, Enhancement (None/Gradient/Image), gradient controls (from/to/direction — 6 angles), image upload with size/position/fixed/overlay controls
5. **Section Effects** — Box shadow preset (None/Soft/Mid/High), Border top/bottom toggles, border color
6. **Cards & Grid** (only for: services, features, whyus, testimonials, team, pricing, faq) — Card bg, corner radius (MD/LG/XL), drop shadow (None/Soft/Elevated)

**Footer**: "Apply & Close" button, "Reset Custom Styling" button (clears all styles).

---

### `IframeCanvas.tsx`

V2 element tree rendered in a `<iframe srcDoc>`. All interaction happens via `postMessage`.

**`srcdoc`** (debounced 100ms): `BASE_CSS` reset + user CSS from `generateCSS` + body HTML from `generateHTML` + 4 injected scripts.

**4 injected scripts**:
1. **`IFRAME_SCRIPT`** — click=SELECT, double-click=inline edit+CONTENT message, receives `el-sel`/`FIND_AT_POINT`/`GET_BOUNDS` commands
2. **`DRAG_SCRIPT`** — makes every `[data-id]` draggable, sends `REPARENT { dragId, targetId }` on drop
3. **`ANIMATION_SCRIPT`** — reads `data-animate` JSON; handles initial/animate, `whileInView` (IntersectionObserver), `whileHover`, `whileTap` via vanilla CSS transitions
4. **`BASE_CSS`** — box-sizing reset, hover outline (1px dashed purple), selected outline (2px solid, resize: both)

**Viewport widths**: mobile=375px, tablet=768px, desktop=100%

**postMessage (parent → iframe)**: `el-sel`, `FIND_AT_POINT`, `GET_BOUNDS`

**postMessage (iframe → parent)**: `SELECT`, `CONTENT`, `RESIZE`, `REPARENT`, `POINT_RESULT`, `BOUNDS_RESULT`

---

### `SelectionOverlay.tsx`

Portal-based resize/move handles rendered over the iframe canvas via `createPortal(…, document.body)`.

**8 directional handles**: n/s/e/w/ne/nw/se/sw — placed at fractional positions on element bounds.

**Center move zone**: inset by `min(8, min(w,h)/4)` to prevent overlap with handles.

**During drag**: disables pointer-events on all iframes to prevent mouse capture. Re-enables on mouseup.

**Commits**: `onCommitResize(id, "240px", "120px")` on resize; `onCommitMove(id, position, topPx, leftPx)` on move (upgrades `static` → `relative` if needed).

---

### `LayersPanel.tsx`

Visual tree panel for V2 element tree.

**Exported pure functions**: `deleteFromTree`, `duplicateInTree`, `moveInSiblings`, `indentRight` (nest into prev sibling), `indentLeft` (un-nest from parent)

**DnD**: `@dnd-kit/sortable` for root-level reorder only. Drag ghost shows purple pill with tag name.

**Context menu** (right-click): Duplicate, Move Up/Down, Add Div Child, Nest into prev sibling, Un-nest, Delete.

**Breadcrumb** (bottom): ancestry path of `selectedId`; each node is a clickable button.

---

### `StylesPanel.tsx`

Side panel for tokens (colors/fonts/spacing) and named classes.

**TokenColors / TokenFonts / TokenSpacing** — CRUD lists for each token type. ColorToken includes native `<input type="color">` + hex text input.

**ClassEditor** — 10-property inline CSS editor (color, backgroundColor, fontSize, fontWeight, lineHeight, padding, borderRadius, display, gap, maxWidth). Desktop only.

**Usage hint**: `var(--color-name)` syntax shown at bottom.

---

### `ExportModal.tsx`

Download project as ZIP.

**V2 export** (shown when elements exist): `POST /api/export/elements` → `index.html` + `style.css` + `README.md`

**V1 stacks**: `html` (static), `nextjs` (with optional mongodb/mysql), `laravel` (with optional mysql). **Note: V1 export route is currently broken on the backend** — see Known Issues.

---

### `PropertiesPanel/index.tsx`

V2 element style inspector (right panel, iframe canvas).

**8 sections** (all accordion, Layout+Spacing open by default):
1. **Layout**: Display (Block/Flex/Grid/None), Flex/Grid sub-controls, Overflow
2. **Spacing**: delegates to `SpacingBox`
3. **Size**: Width, Height, Min-H, Max-W with unit dropdowns (px/%/vw/vh/em/rem/auto)
4. **Typography**: Size, Weight (400–800 segmented), Color, Align, Line-H, Letter-spacing, Transform, Family
5. **Background**: Color, Image URL; Size/Position when image set
6. **Border**: Width, Style, Color, Radius, per-corner
7. **Effects**: Opacity slider, Box shadow presets (4 quick-picks), Position (Rel/Abs/Fix), z-index, Cursor
8. **Motion**: delegates to `MotionSection`

---

### `PropertiesPanel/MotionSection.tsx`

Animation config sub-panel.

**8 built-in presets**: fadeIn, fadeInUp, fadeInDown, fadeInLeft, fadeInRight, zoomIn, zoomOut, slideUp

**Trigger options**: On Load (`animate`) vs On Scroll (`whileInView` + IntersectionObserver viewport)

**Timing controls**: Duration (0.1–2s), Delay (0–1.5s), Easing (Ease/In/Out/In-Out/Linear)

**Interaction**: Hover scale toggle (0.8–1.3), Press scale toggle (0.7–1.0)

**AI Suggest**: calls `POST /api/builder/animate-element` with plain English description; applies returned `AnimationConfig`

---

### `PropertiesPanel/SpacingBox.tsx`

Visual DevTools-style box model widget showing margin (blue) and padding (green) zones. Click-to-edit individual sides. Reads breakpoint overrides with desktop fallback.

---

### `useHistory.ts` (hook, currently unused)

Generic typed `useReducer`-based history. Actions: SET (push to past), UNDO, REDO, RESET. MAX_HISTORY=50. Returns `{ blocks, set, undo, redo, reset, canUndo, canRedo }`.

> **Note**: `page.tsx` implements its own inline history with raw `useState` + debounce timer instead of this hook.

---

## Builder — V2 Data Model

```typescript
// Every element is an ElementNode:
{
  id: string
  tag: HTMLTag
  className?: string                  // named class from project.classes[]
  content?: string                    // text for leaf nodes
  attrs?: Record<string, string>      // href, src, alt, type…
  styles: { desktop: Styles; tablet?: Partial<Styles>; mobile?: Partial<Styles> }
  children: ElementNode[]
  animation?: AnimationConfig         // entrance/scroll/hover/press
  layout?: FreeLayout                 // free canvas: x, y, width, height, rotation, zIndex
}
```

**CSS cascade in the iframe**: `:root` tokens → `.namedClass` → `[data-id="…"]` element overrides

---

## Builder — Undo / Redo

```
setBlocks(val | fn)  →  records to past[], clears future[]  (1.5s debounce)
resetBlocks(arr)     →  clears history entirely (used on page switch)
undo()               →  moves present → future[0], past[-1] → present
redo()               →  moves present → past[-1], future[0] → present
```
- History capped at 50 entries
- Auto-save runs every 30 seconds when `saved === false`

---

## Builder — Keyboard Shortcuts

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
| **Free canvas** | |
| `V` | Move tool |
| `H` | Hand tool |
| `A` | Frame tool |
| `R` | Rect tool |
| `T` | Text tool |
| `⌘0` | Fit to screen |
| `⌘1` | 100% zoom |
| `⌘+/-` | Zoom in/out |
| `[` / `]` | Z-order backward/forward |
| `Shift+[` / `Shift+]` | Z-order back/front |
| Arrows | Nudge 1px (Shift=10px) |
| `⌘C/V` | Copy/paste |
| `⌘D` | Duplicate |
| `⌘Z` | Undo |

---

## Builder — AI Generation Details

All AI routes call Gemini 2.5 Flash, rate-limited to 5 req/min/IP.

- **Full site (V1)** — `POST /api/builder/generate` — full pages + blocks with theme guide
- **Page blocks (V1)** — `POST /api/builder/generate-page` — 2–5 blocks for current page
- **Single block (V1)** — `POST /api/builder/regenerate-block` — regenerates one block type
- **Element tree (V2)** — `POST /api/builder/generate-elements` — `ElementNode[]` + `StyleClass[]` with dedup
- **Single element (V2)** — `POST /api/builder/regenerate-element` — modifies one subtree, preserves original `id`
- **Animation** — `POST /api/builder/animate-element` — `AnimationConfig` from plain English

---

## Onboarding Wizard Flow

```
Step 1 — Business name         → text input
Step 2 — Business type         → clickable tile grid (auto-advances on click)
Step 3 — Description           → textarea (20-char minimum)
Step 4 — Color & theme         → 6 color palettes + 4 visual theme cards → Generate
```

**Generation animation**: cycling messages + animated skeleton blocks (pulsing grey bars).

**Welcome overlay** (after first generation): "Your site is ready!" with Start editing / Preview live buttons. First block click shows tooltip "Click any block to edit it"; dismissed by clicking.

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

## localStorage Keys

| Key | Value |
|-----|-------|
| `lhrweb_saved_sections` | `ComponentDef[]` — pre-built section presets saved by the user |
| `lhrweb_saved_elements` | `SavedElementComponent[]` — custom elements saved by the user |
| `lhrweb_auth_token` | JWT bearer token |
| `lhrweb_pkg` | `"starter"` or `"pro"` |

---

## How the Homepage Works

1. Next.js server fetches `GET /api/pages/home`
2. Response includes `contentSections[]` — each has `blocks[]`, `enabled`, `order`
3. Sections filtered by `enabled: true`, sorted by `order`
4. `<PageSections>` renders each; `<BlockRenderer>` renders individual blocks
5. SEO meta (title, OG, JSON-LD) built from CMS page data

---

## What Is Already Built

### Platform
| Feature | Status |
|---------|--------|
| Public website + CMS | Done |
| Admin panel (all content types) | Done |
| Customer auth (login, register, password reset) | Done |
| Stripe subscriptions (checkout, portal, webhooks, idempotency) | Done |
| Customer dashboard (sites, billing, profile, support) | Done |
| Subdomain routing (`slug.domain.com`) | Done |
| Custom domain support (DNS TXT verification) | Done |
| Admin analytics (users, subs, sites counts) | Done |
| Email notifications (welcome, payment, cancel, reset) | Done |
| Input validation (Zod), global error handler | Done |
| Cloudinary uploads (env-gated, disk fallback) | Done |

### Website Builder — V1 (Block-based)
| Feature | Status |
|---------|--------|
| AI full-site generation (Gemini 2.5 Flash) | Done |
| 4-step onboarding wizard | Done |
| Per-page + per-block AI regeneration | Done |
| Block library (ComponentPicker) with search | Done |
| Visual canvas editor (row/column layout) | Done |
| V1 PropertiesPanel (block-level styles) | Done |
| Undo/redo (50-step, 1.5s debounce) | Done |
| Auto-save every 30s | Done |
| Keyboard shortcuts | Done |
| Responsive preview (desktop / mobile toggle) | Done |
| Export as HTML / Next.js / Laravel ZIP | Done (backend V1 export broken — see Known Issues) |
| Generation skeleton + welcome overlay + first-click tooltip | Done |
| blockToElements() convert block → free canvas | Done |
| V1 block saved to localStorage as component | Done |

### Website Builder — V2 (Element Tree, Flow Mode)
| Feature | Status |
|---------|--------|
| `ElementNode` recursive tree data model | Done |
| `IframeCanvas` — srcDoc iframe with postMessage selection + inline edit | Done |
| Layers panel — tree inspector, DnD reorder, context menu, breadcrumb | Done |
| V2 PropertiesPanel — full style inspector with breakpoint tabs | Done |
| SpacingBox — visual margin/padding box model widget | Done |
| Named CSS class system (`project.classes[]`) | Done |
| Design tokens — colors, fonts, spacing (`project.tokens`) | Done |
| StylesPanel — token editor + class editor | Done |
| V2 AI generation (`generate-elements`, `regenerate-element`) | Done |
| Clean HTML + CSS export (V2 ZIP) | Done |
| Animation & interaction layer — presets, scroll triggers, hover/press | Done |
| AI animation assist (`animate-element`) | Done |
| SelectionOverlay — portal resize/move handles for iframe canvas | Done |

### Website Builder — Free Canvas (Figma-like Mode)
| Feature | Status |
|---------|--------|
| Infinite pan/zoom canvas (FreeCanvas) | Done |
| Pan with space+drag, middle-mouse, hand tool | Done |
| Dot grid + pixel rulers | Done |
| react-rnd drag/resize for free elements | Done |
| Scale-invariant resize handles (`8/scale` CSS px) | Done |
| `scale={scale}` prop on Rnd (correct drag at any zoom) | Done |
| Live drag/resize coordinate label | Done |
| Scale-invariant selection border (`1.5/scale` px) | Done |
| Snap guides during element drag | Done |
| Multi-select (rubber-band + Shift-click) | Done |
| Multi-select bounding box overlay | Done |
| AlignToolbar — 8 alignment/distribution actions | Done |
| Figma-style Frames (artboards) — drag label to move | Done |
| Frame resize from corner handle | Done |
| Frame inline rename (double-click) | Done |
| FrameContent — elements inside frames with rubber-band select | Done |
| CanvasLayersPanel — frame + element tree, reorder, rename, delete | Done |
| CanvasToolbar — tool palette, frame presets, save status | Done |
| CanvasPropertiesPanel — Figma-style Position/Layout/Appearance/Typography/Fill/Stroke/Effects | Done |
| AddPanel — Elements/Sections/AI/My Designs tabs | Done |
| ConvertModal — frame → saved design (HTML+CSS ZIP + API save) | Done |
| Saved designs panel in AddPanel (My Designs tab) | Done |
| Save canvas state (frames, zoom, pan) to backend | Done |
| Restore canvas state on project load | Done |
| Inline text edit inside Rnd elements | Done |
| Z-order control ([ ] keyboard shortcuts + context menu) | Done |
| Copy/paste elements | Done |

---

## Known Issues

| Issue | Location | Impact |
|-------|----------|--------|
| V1 export route broken | `backend/routes/export.js` line 3 | `POST /api/export` throws `ZipArchive is not a constructor` — html/nextjs/laravel export is dead. V2 export (`/api/export/elements`) works fine. |
| Admin password reset on every boot | `backend/app.js` startup sequence | `admin@lhrweb.com` password is reset to `Admin@123` every server restart — you cannot change it persistently |
| CORS fully open | `backend/app.js` | `cors()` with no options allows any origin — fine for dev, security issue for production |
| `GET /public/:projectId` no status filter | `backend/routes/builder.js` | Exposes `generating`/`empty` projects to anyone with the MongoDB ObjectId |
| `useHistory.ts` unused | `frontend/app/builder/hooks/useHistory.ts` | The hook exists but `page.tsx` uses its own inline undo/redo |

---

## What Still Needs Setup

| Feature | Notes |
|---------|-------|
| Subdomain DNS | Needs wildcard `*.yourdomain.com` A record at domain registrar |
| Cloudinary | Add 3 env vars to `backend/.env` to activate |
| Stripe live keys | Replace `sk_test_` keys before launch |
| Custom domain SSL | Needs Caddy or nginx wildcard cert on server |
| Fix V1 export | `export.js` needs `const archiver = require("archiver")` not destructured |

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
SMTP_PASS=xxxx xxxx xxxx xxxx         # Gmail App Password
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

Default admin: `admin@lhrweb.com` / `Admin@123` (reset on every server start)
