# LHRWEB — Master Implementation Plan

## 1. Purpose

This is the execution plan for completing LHRWEB from the current codebase. It is based on STRUCTURE.md (architecture), STATUS.html (verified implementation status), and BLUEPRINT.md (dependency-aware build order).

The goal is to complete the product around the existing foundation, not replace it.

---

# 2. Product Definition

LHRWEB is a SaaS website platform where customers subscribe and create/manage websites through:

1. Flow Mode
2. Free/Figma Mode
3. AI generation

Customer websites can connect to CMS, ecommerce, forms, assets, SEO, navigation, and publishing.

Core flow:

```text
LHRWEB Platform
      ↓
Customer
      ↓
Project / Website
      ↓
Website Structure
      ↓
Flow / Free / AI
      ↓
ElementNode
      ↓
Data Binding
      ↓
HTML/CSS Renderer
      ↓
Preview
      ↓
Publish
      ↓
LHRWEB Subdomain / Custom Domain
```

---

# 3. Existing Foundation

The current codebase already contains:

## Platform
- Public website
- Customer authentication
- Customer dashboard
- Admin panel
- Stripe Checkout
- Stripe Billing Portal
- Stripe webhooks
- Site management
- Content management
- Leads

## Builder
- Flow/V1
- Flow/V2
- Free/Figma-style canvas
- Shared ElementNode model
- Layers
- Selection
- Drag/resize
- Grouping
- Rotation
- Aspect locking
- Design tokens
- Breakpoints
- Color picker
- Font picker
- Fills
- Auto Layout
- Components
- Convert-to promotions
- Preview
- Undo/redo

## AI
- Site generation
- Site planning
- Page generation
- Element generation
- Element editing
- Block regeneration
- Content rewriting
- SEO generation
- Theme suggestions
- Animation generation
- Zod validation
- Repair loop
- Quotas
- Circuit breaker
- Async jobs
- Evaluation harness

## Backend
- Express
- MongoDB/Mongoose
- BuilderProject
- CMS models
- Commerce models
- Subscription models
- AI job/log models
- Upload infrastructure
- Export infrastructure
- Custom-domain backend

## Publishing
```text
ElementNode[]
      ↓
generateHTML()
      +
generateCSS()
      ↓
Published Website
```

---

# 4. Product Architecture

```text
LHRWEB
│
├── Platform
│   ├── Authentication
│   ├── Users
│   ├── Dashboard
│   ├── Admin
│   ├── Billing
│   ├── Subscriptions
│   └── Projects
│
├── Website Project
│   ├── Website Structure
│   ├── Pages
│   ├── Navigation
│   ├── Builder
│   ├── Components
│   ├── CMS
│   ├── Ecommerce
│   ├── Forms
│   ├── Assets
│   ├── SEO
│   └── Publishing
│
├── AI
│   ├── Generation
│   ├── Editing
│   ├── Content
│   ├── SEO
│   └── Theme
│
└── Runtime
    ├── Renderer
    ├── Preview
    ├── Published Sites
    ├── Domains
    └── Analytics
```

---

# 5. Core Architectural Rules

### Rule 1 — Keep one ElementNode model
Flow, Free Mode and AI continue to converge on the same builder representation.

### Rule 2 — Keep one rendering pipeline
Published websites continue through the shared HTML/CSS rendering layer.

### Rule 3 — Separate editing from runtime
Builder state is for authoring; published runtime consumes a stable project representation.

### Rule 4 — Make data binding generic
CMS and Ecommerce must use the same binding mechanism.

```text
Element
  ↓
Property
  ↓
Binding
  ↓
Data Source
  ↓
Field
```

### Rule 5 — Reuse CMS/Commerce UI infrastructure
The field-binding picker should be shared.

### Rule 6 — Preserve publish compatibility
A feature is not complete until it works on the published site, not only on the canvas.

---

# 6. Phase 0 — Builder State Architecture — ✅ done (2026-09-02)

## Objective
Reduce pressure on builder/page.tsx before CMS and commerce functionality expands.

## What actually shipped
Three hooks in `frontend/app/builder/hooks/`: `useSelectionState.ts`, `useCanvasModeState.ts`, `useSaveOrchestration.ts`. Wired into `page.tsx` via destructuring with property names matching the original local variables, so existing call sites needed no changes. Two notes on scope vs. the spec below:
- "group selection" is covered by the existing `freeSelectedIds`/`selectedFrameElementIds` arrays (multi-select) — there was never a separate grouping concept in `page.tsx` to extract.
- "pan" was not extracted because it doesn't exist as `page.tsx` state today — canvas pan/scroll position is handled locally inside the `FreeCanvas` component, not lifted to the page level. Left as-is; not a Phase 0 regression, just a spec item that didn't match the actual code.

Verified: `tsc --noEmit` clean, `next build` clean (full route manifest incl. `/builder`), and a new Vitest suite (10 tests across the three hooks) passing. Frontend test infrastructure (Vitest + React Testing Library) was stood up from scratch as part of this phase — previously `frontend/package.json` had zero test tooling.

## Extract

### Selection state
- selected element IDs
- multi-selection
- active frame
- selection clearing
- group selection

### Save orchestration
- dirty state
- save status
- save queue
- AbortController
- retry
- recovery snapshot
- errors

### Canvas mode state
- Flow
- Free
- Preview
- viewport
- active frame
- zoom
- pan

## Done when
- page.tsx no longer owns all three state categories
- current behavior remains unchanged
- save/retry/recovery still works
- ElementNode remains compatible

---

# 7. Phase 1 — Production Readiness — ✅ done (2026-09-02), see caveats per section

**Before this phase's own scope, a prerequisite fix landed:** the public site-serving path was broken — custom domains 404'd (no `/site/domain/[host]` route existed), subdomains resolved by the wrong lookup (`findById` on what is actually a slug), and the V2 `elements` render pipeline (`generateHTML`/`generateCSS`) was never wired into any public route (only the legacy V1 `blocks` viewer was). Fixed via `frontend/lib/publicSite.ts` (shared resolve/canonical/metadata helpers), a new `frontend/app/(frontend)/site/_shared/PublicSiteView.tsx` shared renderer, rewritten `/site/[projectId]/[[...rest]]` and new `/site/domain/[host]/[[...rest]]` routes, and a `middleware.ts` fix so `/robots.txt`/`/sitemap.xml` bypass the subdomain/domain rewrite. Verified end-to-end against real production data (not just synthetic tests) — see `STATUS.html`. This also caught two pre-existing runtime bugs (unguarded `tokens.spacing`/`el.styles` access in `generateCSS.ts`/`generateHTML.ts`) that only surfaced against real documents missing those sub-fields.

## 7.1 Custom Domains

Build:

```text
Project Settings
  ↓
Domains
  ↓
Add Domain
  ↓
DNS Instructions
  ↓
Verify
  ↓
Connected
```

States:
- Not connected — ✅
- Pending — ✅ ("Pending verification" badge)
- Verified — ✅
- Failed — ⚠️ partial: a failed verify attempt shows an inline error in the modal, but there's no distinct *persisted* "Failed" status — it just stays "Pending" until the next verify attempt succeeds.
- Removed — ✅ (new `DELETE /api/builder/:id/custom-domain` route + remove button)

Built: `frontend/app/builder/_components/DomainModal.tsx`, wired into `page.tsx` via a "Domain" toolbar button next to SEO/Theme. Verified end-to-end against the real backend (set → verify → persisted state → remove, plus a real resolved-domain render) — see `STATUS.html`.

## 7.2 SEO

Complete:
- sitemap.xml — ✅ host-aware (`app/sitemap.ts`): root domain enumerates static + CMS pages/services/blog; each subdomain/custom domain gets its own project-scoped sitemap.
- robots.txt — ✅ host-aware (`app/robots.ts`) to match.
- canonical URL — ✅ (`alternates.canonical`, matches the URL that actually resolves).
- OG title — ⚠️ partial: reuses the page's SEO title rather than being a separate field.
- OG description — ⚠️ partial: reuses the page's SEO description rather than being a separate field.
- OG image — ✅ new `seo.ogImage` field, end-to-end (schema → save route → `SeoModal` UI → `generateMetadata`).
- social metadata — ⚠️ partial: Twitter `summary_large_image` card emitted only when an OG image is set; no separate Twitter-specific fields.
- structured data support — ❌ missing: no JSON-LD emitted anywhere. Not started.

All of the above only ever reached real visitors starting with this phase's serving-path fix (§7 prerequisite) — previously the builder-published route was fully client-rendered with zero server-side metadata.

## 7.3 Draw Modifiers

- Shift → square/circle — ✅ (pre-existing, `FreeCanvas.tsx` `handleMouseMove`, confirmed already committed before this phase).
- Alt → draw from center — ✅ (pre-existing, same location).
- Shift + Alt → square/circle from center — not explicitly tested; the two modifiers are independent `if` branches so they should combine, but this combination wasn't specifically exercised.

## 7.4 Ruler Guides

- horizontal guides — ✅
- vertical guides — ✅
- drag from ruler — ✅ (`startGuideDrag` in `FreeCanvas.tsx`, mousedown on the ruler gutter)
- move — ❌ missing: an existing guide can be deleted (double-click) but not dragged to a new position — you'd delete and redraw it instead.
- delete — ✅ (double-click)
- persistence — ✅ new `CanvasGuide[]` type, saved in `project.canvasState.guides` alongside `frames`
- visibility — ✅ always rendered when present, dashed teal line

Not exercised in an actual browser (no browser-automation tool available this session) — verified via `tsc --noEmit`, a clean production build, and by mirroring the exact coordinate-conversion (`screenToCanvas`) and rendering pattern already proven by the adjacent, working `SnapGuide` feature. Flagged here rather than claimed as fully verified.

## Exit Criteria

A customer can connect a custom domain (with a live, working render behind it — see the serving-path fix above), get baseline SEO (sitemap/robots/canonical/OG image, with OG title/description/Twitter-card as partial reuses and no structured data yet), use the pre-existing Figma-style draw modifiers, and create/delete (but not yet reposition) persistent ruler guides.

---

# 8. Phase 2 — CMS Foundation — ✅ done (2026-09-02), see per-section notes

This is the first major product expansion.

**What actually shipped, in one paragraph:** the backend (§8.1–8.4's collection/entry model) already existed with zero UI — this phase built the UI (`frontend/app/builder/_components/CmsPanel.tsx`, a new "Data" tab) and the field-binding picker (§8.5, `BindDataModal.tsx`), plus made bindings actually resolve into real content on the *published* site (a new public `GET /api/cms-collections/public/:projectId` route + `resolveCmsBindings()`, verified end-to-end against a real project's data — collection → entry → bind → confirmed the live rendered HTML showed the CMS value, not the placeholder). See §8.2, §8.5, and §8.6 below for exactly which parts of the original spec landed as spec'd vs. as a narrower cut.

## 8.1 Collections

```text
Collection
├── Name
├── Slug
├── Description
├── Fields
└── Entries
```

## 8.2 Field Types — ⚠️ unchanged, still 6 of 14

Minimum (spec):
- Text — ✅
- Long text — ✅ (`richtext`, plain textarea — no rich-text editor)
- Rich text — see above, same field type
- Number — ✅
- Boolean — ✅
- Image — ✅ (a URL string field, not an upload/media-library picker)
- File — ❌ missing
- URL — ❌ missing
- Email — ❌ missing
- Date — ✅
- Select — ❌ missing
- Multi-select — ❌ missing
- Reference — ❌ missing
- Multi-reference — ❌ missing

This phase built the collection/entry/binding UI on top of the 6 field types the backend already had (`ALLOWED_FIELD_TYPES` in `backend/routes/cms.js`) — it did not expand the type system. Expanding to the other 8 is real backend schema + UI work, not done here.

## 8.3 Collection Management — ✅ done

Users can: create ✅ · rename ✅ · delete ✅ · add field ✅ · edit field ✅ · delete field ✅ · reorder fields ✅ (up/down buttons, not drag-and-drop).

## 8.4 Entry Management — ✅ done, search/sort/paginate are client-side only

Users can: create ✅ · edit ✅ · delete ✅ · duplicate ✅ (re-POSTs the same values under a new de-duped slug) · search ✅ (client-side substring match over an entry's values, not a backend query param) · filter — ❌ not built (search covers the common case) · sort — ⚠️ only the existing manual `order` field, no column sort · paginate ✅ (client-side, 20/page) · save draft / publish / unpublish ✅ (the existing boolean `published` field, toggled from the entry list).

## 8.5 Generic Field Binding — ✅ done, one concrete difference from the spec

Example:

```text
Selected Text
     ↓
Bind Data
     ↓
Blog
     ↓
Title
```

Built exactly this flow (`BindDataModal.tsx`, opened via a "Bind Data" button in the Free-canvas properties panel's new "Data" section). One difference from the spec's example binding shape — it names a collection + field but no specific record, implying resolution figures out *which* entry from page context:

```json
{ "source": "cms", "collection": "blog", "field": "title" }
```

What's actually stored (`CmsBinding` in `frontend/types/builder.ts`) also pins a specific entry, because there's no per-page "this page is one CMS entry" context yet — that's Phase 3's "Dynamic CMS pages":

```json
{ "collectionId": "…", "entryId": "…", "field": "title" }
```

Resolution is real, not just stored metadata: `frontend/lib/resolveCmsBindings.ts` (pure, unit-tested) substitutes the entry's field value into `content` (text elements) or `attrs.src` (`img`), applied in `PublicSiteView.tsx` before `generateHTML`/`generateCSS` run — so a bound element genuinely shows CMS data on the live public site. It is **not** resolved inside the editor canvas itself (the Content field just shows the placeholder, disabled, with a "🔗 Collection → Field" chip) — deliberately, to avoid the bound value getting typed back into stored `content` through the same textarea that displays it.

## 8.6 Binding Compatibility — ✅ done for the types that exist

- Text → text/richtext/number/date — ✅ (`COMPATIBLE_TYPES.text` in `BindDataModal.tsx`)
- Image → image — ✅
- Boolean → visibility/state — ❌ not built (would need a "hide if falsy" binding mode, not just content substitution — out of scope this phase)
- Reference → related record — n/a, no `reference` field type exists yet (§8.2)

## Exit Criteria — ✅ met, except the "Preview" step

```text
CMS Collection          ✅
  ↓
CMS Entry               ✅
  ↓
Canvas element          ✅ (Free-canvas ElementNode only, not Flow/V1 blocks)
  ↓
Bind field              ✅ BindDataModal.tsx
  ↓
Preview                 ❌ editor canvas still shows the placeholder, not the bound value
  ↓
Published page shows real CMS data   ✅ verified against a real project end-to-end
```

---

# 9. Phase 3 — Data-Bound Builder — ✅ done (2026-09-02), full scope including commerce

Before starting §9.3–9.6: `Product`/`Collection` backend models + CRUD routes already existed, but `Cart`/`Order` had zero routes, and there was no payment-processor integration for storefront commerce anywhere (`backend/routes/commerce.js` itself: "Deliberately does NOT include cart/checkout/orders/Stripe webhooks"). Real checkout needed a payment-approach decision — asked the user, who chose **Stripe Connect** (each project owner connects their own account, payouts go directly to them via destination charges, platform takes an application fee — `PLATFORM_FEE_BPS = 500` i.e. 5% in `commerce.js`, the one number here worth revisiting before real launch). §9.1–9.2 shipped first (no external dependency), then §9.3–9.6 on top of the Connect decision.

**A verification limit, stated once here rather than repeated per section below:** this dev environment's `STRIPE_SECRET_KEY` is a documented placeholder (`sk_test_REPLACE_WITH_YOUR_KEY`), confirmed via a real failed Stripe API call. Everything in §9.3–9.6 that calls Stripe directly (account creation, checkout session creation) is structurally correct against Stripe's documented API and mirrors the pre-existing, working subscriptions-billing integration — but was not exercised against a live Stripe sandbox. Every non-Stripe-API piece — product CRUD, the cart lifecycle, the binding/list/template resolution, and the webhook's order-creation *logic* (called directly with a synthetic Stripe session object, bypassing only signature verification) — was verified against the real database.

## 9.1 CMS Lists — ✅ done

Added:

```text
Convert to CMS List
```

Structure — built exactly as spec'd:

```text
Collection
  ↓
Query
  ↓
Item Template
  ↓
Repeating Elements
```

`CmsListModal.tsx` picks the collection + query; the query is stored as `cmsList: CmsListQuery` on the container `ElementNode`, and the container's *existing children* are the item template — resolved by `resolveCmsBindings()` (`frontend/lib/resolveCmsBindings.ts`), which clones the template once per matching entry and resolves any nested `cmsBinding`s (with `entryId` omitted) against that entry.

Support:
- filters — ⚠️ one equality filter (`filterField`/`filterEquals`), not a general filter DSL
- sorting — ✅ single field, asc/desc
- limits — ✅
- pagination — ❌ not built — a repeated list on a static published page doesn't have a natural pager without client-side JS or URL params, judged out of scope for this pass
- search where applicable — ❌ not built, same reasoning as pagination

## 9.2 Dynamic CMS Pages — ✅ done

Support route patterns such as:

```text
/blog/[slug]
```

The route resolves the corresponding CMS entry — built via a page-level `cmsTemplate: { collectionId, pathPrefix }` field (`CmsTemplateModal.tsx`, set from a small icon next to each page in the Free-canvas Pages list), resolved in the existing `[[...rest]]` catch-all routes (built in Phase 1) by `resolveDynamicPage()`/`resolvePageAndContext()` in `frontend/lib/publicSite.ts`. Canonical URL and `<title>` for a dynamic page use the real path and a best-effort entry title (`guessEntryTitle()` — prefers a field literally named `title`/`name`), not the `?slug=` convention regular pages use, since this route genuinely resolves via real path matching.

One real bug found and fixed by live testing, not by inspection: an unpublished or nonexistent entry under a real template's path prefix was silently falling back to rendering the *homepage* instead of a proper 404 — because "no dynamic match" and "dynamic match but entry missing" were conflated into one `null` return. Fixed by making `resolveDynamicPage()` return three distinct states (`undefined` = not a template-shaped request at all → fall back to normal page-picking; `null` = a real template prefix but no matching published entry → genuine 404; a resolved `{page, entry}` otherwise), re-verified against real data afterward.

## 9.3 Products — ✅ done, variants are a simpler cut than a full options matrix

Product management built (`ProductsPanel.tsx`) for: name ✅ · slug ✅ (auto-generated, existing backend) · description ✅ · images ✅ (URL list, not an upload/media-library picker) · price ✅ · compare-at price ✅ · SKU — ⚠️ only on variants, not the base product (matches the existing `Product` model, which never had a base-product SKU field) · inventory ✅ (track + quantity) · status ✅ (draft/active/archived) · collections ✅ (toggle chips, symmetric with the Collections tab) · variants — ⚠️ a flat list editor (id/title/price/sku/inventory), not a Shopify-style options-matrix generator (pick "Size" + "Color" → auto-generate every combination) — real and useful, but a simpler foundation-pass cut · metadata — ⚠️ not built as a distinct free-form field (tags/vendor exist on the model but have no UI yet).

## 9.4 Product Cards — ✅ done

Added:

```text
Convert to Product Card
```

Bindings (`BindProductModal.tsx`, resolved by `resolveProductBindings.ts`):
- image — ✅
- name — ✅
- price — ✅ (hardcoded `$` formatting, no multi-currency — matches checkout, which is hardcoded to `currency: "usd"` server-side too)
- compare price — ✅
- availability — ✅ ("In Stock"/"Out of Stock" text, derived from `inventory.track`/`quantity`)
- URL — ✅ (needs a `productTemplate` page to have a real target; resolves to nothing if none exists)
- Add to Cart — ✅, see §9.6

## 9.5 Storefront — ✅ done, order confirmation is deliberately minimal

Support:
- product listing — ✅ "Convert to Product List" (`productList` on a container, mirrors CMS Lists' repeat mechanism)
- collection listing — ✅ (via `productList.collectionId`)
- product detail — ✅ `productTemplate` page marking, real path `/<pathPrefix>/<product-slug>`, reusing the `[[...rest]]` catch-all routes from Phase 1 exactly like CMS dynamic pages
- cart — ✅ `CartWidget.tsx`, see §9.6
- checkout — ✅ redirects to real Stripe Checkout (destination charge)
- order confirmation — ⚠️ deliberately minimal: a static "payment received" page, no order lookup by Stripe session id (would need a new public order-read route — judged not worth the added public API surface for a foundation pass)

## 9.6 Cart — ✅ done

Support:
- add to cart — ✅ `POST /cart/:cartToken/items`, plus the one piece of real client-side interactivity anywhere on the published site: `CartWidget.tsx` listens for clicks on `[data-add-to-cart]` via DOM event delegation (those elements are injected via `dangerouslySetInnerHTML`, outside React's own tree) and calls the cart API directly
- remove — ✅ `DELETE /cart/:cartToken/items/:productId` (keyed by productId+variantId, not a synthetic item id — `cartItemSchema` is deliberately `{ _id: false }`)
- quantity update — ✅ `PUT /cart/:cartToken/items/:productId`
- cart view — ✅ the drawer in `CartWidget.tsx`
- checkout — ✅ `POST /checkout` → Stripe Checkout Session with `payment_intent_data.transfer_data.destination` set to the project's connected account

## Exit Criteria — ✅ met, including §9.3–9.6

```text
Products              ✅ ProductsPanel.tsx
  ↓
Storefront             ✅ productList / productBinding on any page
  ↓
Product Detail         ✅ productTemplate → /<pathPrefix>/<product-slug>
  ↓
Add to Cart            ✅ addToCart marker + CartWidget.tsx event delegation
  ↓
Cart                   ✅ real cartToken-keyed API, verified end-to-end
  ↓
Checkout               ✅ real Stripe Checkout Session (destination charge) —
  ↓                       API call itself unverified live, no valid Stripe key here
Order                  ✅ webhook-only creation, logic verified with a synthetic
                          Stripe session against the real database
```

---

# 10. Phase 4 — Real Component System — ✅ done (2026-09-02), bounded scope by explicit choice

Current components are copy-based. Target of this spec: master-linked components (instances store only `componentId` + overrides, no embedded structure). **What actually shipped is a deliberately bounded version of this** — see the scope note below the Exit Criteria, which explains why, and covers every requirement in this section except literal live-linked storage.

Before starting: investigation found the existing "Update Master + Push to Instances" button already does a one-time, explicit propagation — but does it by blindly full-tree-replacing every instance, which **silently destroys any instance-specific customization** (a button instance's own label, a card's own image) on every push. That's a real, shipping bug, not a hypothetical. True master-linked storage (per this section's original spec) would mean rearchitecting how elements are stored and read across selection, drag/resize, the properties/layers panels, undo/redo, and the publish pipeline. Asked the user which depth to build: chose the bounded option — fix the actual bug, add real override-preserving propagation, leave element storage untouched.

## Component definition

```text
Component
├── Master structure       ✅ ProjectComponent.rootElement (unchanged)
├── Properties              — n/a, no separate "component properties" system was built (see Overrides below)
├── Variants                 ✅ ProjectComponent.variants
└── Slots                    ✅ ProjectComponent.slotPaths
```

## Instance — ⚠️ scoped differently, see the note above

Spec'd:

```text
componentId
+
instance overrides
```

"Do not duplicate the complete master structure" is the one requirement not met by design — an instance is still `componentId` + `variantId` + **the full element tree**, per the bounded-scope decision. What the spec's "overrides" concept turned into instead: `ProjectComponent.slotPaths` (index-paths into the master an author declares customizable) plus the instance's own tree at those paths *is* the override — coarser-grained than a generic property-diff system, but it's real, it round-trips, and it directly fixes the push bug.

## Overrides — ✅ covered via slots, not a generic per-property diff

Spec'd granular override support:
- text — ✅ (as part of a slot's whole subtree)
- image — ✅ (as part of a slot's whole subtree)
- link — ✅ (as part of a slot's whole subtree)
- style — ⚠️ only if the styled node is itself inside a slot path; there's no way to override *just* a style property on an otherwise-synced node
- visibility — ⚠️ same caveat as style
- component properties — ❌ not built; no separate "component properties" concept exists (components don't have typed props, only structural slot content)

## Master propagation — ✅ done, and the real bug fixed

```text
Master Button
     ↓
All instances on the same variant update — slot content preserved, everything else synced
```

`handleUpdateMaster` (`frontend/app/builder/page.tsx`) rewritten to use `mergeMasterIntoInstance()` (`frontend/lib/componentInstances.ts`) instead of a blind full-tree replace. Still an explicit, manual push (not continuous/automatic) — that part of the original bounded design (per Phase 4's original framing in `BLUEPRINT.md` §5) didn't change, only its correctness did.

## Variants — ✅ done

```text
Button
├── Primary    ← ProjectComponent.variants[0]
├── Secondary  ← ProjectComponent.variants[1]
├── Outline    ← save any instance's current content as a new variant, from the properties panel
└── Ghost
```

A push only touches instances on the *same* `variantId` as the source instance — variants evolve independently, matching the example's intent exactly.

## Slots — ✅ done

```text
Card
├── Image Slot     ← mark a child "Slot" in the properties panel while it's selected inside an instance
├── Content Slot   ← same
└── Actions Slot   ← same
```

Implemented as `ProjectComponent.slotPaths: string[]` (comma-joined child index-paths, e.g. `"0,2"`) rather than named slots — positionally equivalent, just without a human-readable slot name attached.

## Nested Components — ✅ works, as a consequence of the storage decision

Since instances remain full trees, a component instance nested inside another component's structure works two ways depending on where it sits: inside a slot, it's fully preserved across the parent's pushes (the slot isn't touched); outside a slot, it gets replaced along with the rest of the synced structure on a parent push — but it still has its own, fully independent master/push relationship whenever *it* is the one being pushed. No special-case code was needed for this; it falls out of "instances are still real trees."

## Exit Criteria — ✅ met, within the bounded scope

- master edits propagate — ✅
- instances preserve overrides — ✅, via slots specifically (not a generic override system)
- variants work — ✅
- slots work — ✅
- nested components work — ✅ (see note above on slot vs. non-slot placement)
- published output resolves the same component model — ✅ trivially: instances are baked trees like everything else, so the existing publish pipeline needed zero changes

**Verification:** the merge/path algorithm (`frontend/lib/componentInstances.ts`) has 14 unit tests covering slot preservation, non-slot sync, root-level slots, and a slot whose structural position no longer exists in a changed master. This phase has no public-render surface (it only affects the editor's own save/load of `elements`/`components`), so the integration risk was schema persistence — verified against the real database: saved a component with `slotPaths` + `variants` and reloaded it intact; saved a page-level instance element with every previously-unschema'd field (`componentId`, `variantId`, `layout`, `locked`, `hidden`, `label`) set and confirmed all six survived a save/reload round-trip, which also confirms the second bug fix below.

**A second, unrelated bug fixed along the way:** `componentId`, `label`, `layout`, `locked`, `hidden`, and `animation` had never been added to the backend's `elementSchema` at all — the same class of miss as Phase 2's `cmsBinding` and Phase 3's `productBinding`, just older and wider (it affected every top-level page element carrying those fields, not just Phase 4 instances). Fixed by adding all six fields to the schema.

---

# 11. Phase 5 — Website Structure — ✅ done (2026-09-02)

## 11.1 Page Hierarchy — ✅ done

```text
Home
Services
  ├── Web Design
  └── SEO
Blog
  └── Dynamic Article
Shop
  └── Product
```

`Page.parentId` + `computePagePath()` (root-first, cycle-guarded) in `frontend/lib/publicSite.ts`; `resolvePageByPath()` matches a request against the computed path, tried before the legacy `?slug=` fallback. `PageParentModal.tsx` picks a parent from the builder sidebar (excludes the page itself and its own descendants client-side; the backend independently re-validates and rejects a cycle with a 400 — verified against a real API call that tried to make a page its own grandparent). The example tree above is exactly what was built and curl-verified end-to-end (`/services/web-design`, real hierarchy path, correct canonical URL and sitemap entry).

## 11.2 Page/Route Data — ✅ done, as much as is meaningful here

ID, parent (`parentId`), slug, and SEO settings all existed or were added. "Route" is the *computed* hierarchy path, not a stored field (deriving it avoids a second source of truth that could drift from the actual parent chain). "Page type" and "status" weren't added as new fields — a page's type is already implicit in which template fields are set (`cmsTemplate`, `productTemplate`, or neither), and there's no per-page publish status separate from the project's own `status`; adding either would be new surface area nothing in this phase's scope needed.

## 11.3 Global Navigation — ✅ done

`Menu`/`MenuItem` types (`frontend/types/builder.ts`); `MenusPanel.tsx` manages multiple named menus, `MenuEditor` edits one menu's items — reorder, one level of nesting, page-or-external-URL target, per-item visibility. A menu literally named "Header" (case-insensitive) replaces the default "list every page" auto-nav in `PublicSiteView.tsx`; nested items render as a hover dropdown (desktop) / indented sub-list (mobile). "Dynamic links" (e.g., an auto-generated CMS-collection submenu) wasn't built — out of scope for this phase, not needed by anything else shipped so far. Verified against the live dev server: a configured Header menu correctly overrode the default nav, including the dropdown, an external-URL item, and a hidden item that correctly didn't render.

## 11.4 404 — ✅ done, with a documented HTTP-status tradeoff

`BuilderProject.notFoundPageId` — a project-level custom 404 page, picked from a `<select>` in the builder's "Site → 404" tab. Renders correctly (confirmed against real content via curl) when a genuinely unmatched path is requested. **The catch:** it renders at HTTP 200, not a real 404 — and so does Next's own default not-found page, for the same reason (the route sits below a Suspense-streaming `loading.tsx` boundary that flushes the response before the not-found status can be set — see BLUEPRINT.md's Phase 5 entry for the full root-cause). This was caught and confirmed empirically, not assumed: the *first* build of this feature turned out not to fire at all (a separate, since-fixed bug in `resolvePageAndContext`'s fallback logic), and even after that fix, the status code stays at 200. Fixing the status code itself would require duplicating full page/CMS/product resolution into `middleware.ts` — judged out of proportion to this phase's bounded scope, unlike the redirect fix below (where a wrong status means the feature doesn't work *at all*, not just imperfect SEO). Disclosed directly in the builder UI.

## 11.5 Redirects — ✅ done, real HTTP status (301→308, 302→307)

`Redirect` type (source/destination/301|302/enabled), managed via `RedirectsPanel.tsx`, saved with `PUT /project/redirects`. Resolution moved to `middleware.ts` rather than the page components — the same Suspense-streaming issue that limits §11.4 would have silently broken this too (confirmed by testing: the first implementation, resolved inside the page component, matched the rule correctly but still returned HTTP 200), so redirects are checked pre-render in middleware instead, which can set a genuine status before any rendering starts. Covers subdomain, verified custom-domain, and internal `/site/<id-or-slug>/...` preview-link traffic. 301 maps to Next's `permanentRedirect()` semantics (308), 302 to `redirect()` (307) — an intentional, honest status-code mapping difference (Next.js's App Router redirect helpers don't expose literal 301/302), not a bug. Verified against the live dev server: a 301 rule returns a real 308 with the correct `Location` header, a 302 rule returns a real 307, and a disabled rule correctly doesn't fire.

## Exit Criteria — ✅ met

A website can have a complete hierarchy and global navigation without manually editing each navbar — verified end-to-end: a 3-level page tree (Home / Services / Services → Web Design) rendered correctly at its real nested URL, appeared correctly in the sitemap, and a configured "Header" menu (including a nested dropdown item, an external link, and a hidden item) correctly overrode the default per-page auto-nav on the live site.

---

# 12. Phase 6 — Builder Completion — ✅ done (2026-09-02)

## Styling — ✅ done

Add:
- stroke position — ⚠️ per-side *width* only (shared color/style), see note below
- per-side borders — ✅ done
- per-corner radius — ✅ done
- multiple shadows — ✅ done, for elements (Frames already had this)
- blur — ✅ done
- backdrop blur — ✅ done
- text decoration — ✅ done (full select: none/underline/line-through/overline)
- text transform — ✅ done (full select: none/uppercase/lowercase/capitalize)
- paragraph spacing — ✅ already done (pre-existing, confirmed not newly built)
- truncation — ✅ done (`lineClamp`, expands to the full `-webkit-line-clamp` set)

A toggle switches an element's border between uniform (one width/color/style, the pre-existing behavior) and per-side (4 width inputs, composed into the existing `borderTop`/`Right`/`Bottom`/`Left` shorthand string fields, sharing one color and style rather than each side getting its own — the common real case, not a full independent-per-side-color clone). Per-corner radius uses the identical toggle pattern against the pre-existing `borderTopLeftRadius` etc. fields. Multi-shadow reuses `Frame`'s own `FrameEffect` shape (`Styles.boxShadowLayers`) rather than inventing a parallel shape, and composites into a live preview the same way `Frame.tsx` already composites `frame.effects` — verified via 11 new unit tests on `stylesToCSS.ts`'s composition logic (multi-shadow join, hidden-layer exclusion, the plain-string fallback, and the line-clamp expansion).

## Auto Layout UI — ✅ done

Expose:
- 9-cell alignment — ✅ done (`AlignGrid9`, horizontal/vertical auto layout only — grid mode keeps its Justify/Align selects, since CSS grid's `justify-items`/`align-items` don't map to the same "one shared point" widget)
- Fixed — ✅ already done (pre-existing)
- Fill — ✅ already done (pre-existing)
- Hug — ✅ already done (pre-existing)
- gap — ✅ already done (pre-existing)
- padding — ✅ already done (pre-existing)
- direction — ✅ already done (pre-existing)
- wrap — ✅ done (was hardcoded to `"wrap"` everywhere; now a real per-frame toggle, wired into both the live editor render and the publish pipeline identically)
- grid rows — ✅ done (`Frame.gridRows`, mirrors the pre-existing `gridColumns`)
- grid columns — ✅ already done (pre-existing)

Investigation before writing code found the Auto Layout panel was already real and functional (mode switch, gap, padding, justify/align selects, Fixed/Fill/Hug sizing) — this work was additive UI on a working mechanism, not new architecture.

## Responsive Constraints — ✅ already fully done (pre-existing)

Support:
- left pin — ✅
- right pin — ✅
- top pin — ✅
- bottom pin — ✅
- center — ✅
- width constraints — ✅ (`scale`)
- height constraints — ✅ (`scale`)
- scale behavior — ✅

Investigation before writing any Phase 6 code found this entire sub-section already built and wired end-to-end from an earlier phase: `FreeLayout.constraints` (`horizontal`/`vertical`, each `left|right|center|scale|both`), a UI in `CanvasPropertiesPanel.tsx`, and `applyConstraints()` genuinely invoked on every frame resize in `page.tsx`. Nothing to build — confirmed and documented so it isn't mistakenly re-built later.

## Responsive Frames — ✅ done, bounded scope by explicit choice

Support Desktop, Tablet and Mobile using one logical design with responsive behavior.

**The scope decision:** the Free canvas (Figma-style artboards) has zero relationship model between `Frame`s — a Desktop frame and a Tablet frame are two fully independent element trees today. True "linked frames" (auto-generate Tablet/Mobile from Desktop, propagate edits between them, mirroring Phase 4's master/instance system) would be new architecture. Asked the user: build the bounded version instead — extend the mechanism that already exists (`ElementNode.styles.desktop/tablet/mobile` per-breakpoint overrides, previously wired only for Flow-mode pages) to the Free canvas, rather than invent a Frame-family model.

**What was actually broken, found by tracing the code rather than assuming:** the *save* side was already fully wired — the desktop/tablet/mobile device switcher was already unconditionally visible regardless of canvas mode, and `onStyleChange` already keyed writes by the active breakpoint for both free-standing elements and Frame children. The real gap was the *live render*: `FreeElement.tsx` (the shared component both `FreeCanvas.tsx` and `FrameContent.tsx` use to actually paint an element) only ever read `styles.desktop`, never `tablet`/`mobile`, and had no awareness of the selected device at all. That meant editing a Tablet override was write-only — it saved correctly and would apply correctly once published (`generateCSS.ts` already handled tablet/mobile media queries correctly for any `ElementNode`, Free-canvas-originated or not), but was invisible while editing it, which would have been a confusing, easy-to-miss gap for anyone actually using the feature.

**Fixed:** threaded a `breakpoint` prop through `FreeElement` → `FrameContent`/`FreeCanvas` → `page.tsx`'s `canvasViewport` state, so the canvas merges in the active breakpoint's overrides live — the same compositing approach `Frame.tsx` already uses for `frame.effects`. No new Frame relationship model, no cross-frame propagation, no auto-generation of Tablet/Mobile from Desktop — exactly the bounded scope chosen, and consistent with the Phase 4 precedent for handling a similarly-shaped fork.

## Asset Library — ✅ done, image/video/font/PDF upload (bounded from "everything")

```text
Assets
├── Images     ✅
├── Videos     ✅
├── SVG        ✅
├── Files      ✅ (PDF)
└── Fonts      ✅ (woff/woff2/ttf)
```

Features:
- upload — ✅ done
- browse — ✅ done (grid view, thumbnails for images/SVG, type icons otherwise)
- search — ✅ done (by filename, client-side)
- delete — ⚠️ done for the library record; the underlying stored file is not removed (see note)
- reuse — ✅ done (the picker modal opens from an `<img>`'s Source field or the background-image field's "Browse…" button)
- replace — ✅ done (picking a new asset overwrites the field's URL — no separate "replace" affordance needed beyond that)
- metadata — ⚠️ filename/size/mimetype/type/uploaded-at only — no tagging, alt-text-on-the-asset-itself, or custom fields
- project organization — ✅ done (every asset is scoped to one project's `Asset.projectId`; no folders/collections within a project)

Backend: a new `Asset` model plus `/api/assets` routes (list/upload/delete), auth-required and project-ownership-checked on every route (`BuilderProject.findOne({ _id: projectId, userId })`) — reusing the existing Cloudinary-or-local upload middleware (`backend/middleware/upload.js`, the same one the admin block editors already use) rather than standing up a separate storage path. That middleware's MIME allowlist was widened from images-only to also cover video/font/PDF — a small, additive change (the two pre-existing callers only ever uploaded images, so their behavior is unchanged).

Frontend: `AssetLibraryPanel.tsx` (a standalone "Assets" tab in the builder rail — browse/upload/search/delete) and `AssetPickerModal.tsx` (the same grid, in a modal, opened from an image field with a callback for the chosen URL). `CanvasPropertiesPanel.tsx` also gained real `<img>` Source/Alt fields — there was previously no way to edit an inserted image's `src` at all beyond a hardcoded placeholder URL from the Add panel.

**Verified against the real dev database, not just a clean build:** unauthenticated upload correctly rejected (401); a project the requesting user doesn't own correctly rejected (404, not a data leak); a real file upload creates a real `Asset` record with a genuinely servable URL (confirmed by actually fetching it back); the list endpoint reflects it; delete removes the record and the list goes back to empty.

**Disclosed limitation:** deleting an asset removes it from the library but not from storage — Cloudinary deletion needs the asset's `public_id`, which isn't derivable from its stored URL alone without an extra lookup; adding that was judged out of this phase's bounded scope.

## Exit Criteria

The five sub-areas above are done, verified as described in each, with the Responsive Frames and Asset-deletion tradeoffs explicitly chosen and disclosed rather than silently incomplete. UI-level interaction (clicking through the new controls in an actual browser) was not exercised — no browser-automation tool is available in this environment, the same limitation Phase 1 disclosed for its ruler-guide drag interaction — so this phase is verified by clean type-checking (`tsc --noEmit`), a clean production build (which does execute the component tree once for the statically-prerendered `/builder` route, catching render-time crashes), 98/98 passing unit tests, and a real end-to-end database round-trip for the one sub-area with genuine backend logic (Asset Library).

---

# 13. Phase 7 — Operations — ✅ done (2026-09-02)

## Publish History — ✅ done, bounded scope by explicit choice

Every publish creates a version:

```text
Version 12
Version 11
Version 10
...
```

Store:
- version ID — ✅ (`Version._id`)
- timestamp — ✅ (`Version.createdAt`)
- user — ✅ (`Version.userId`)
- project snapshot — ⚠️ `pages` only, not the whole project document (menus/redirects/classes/tokens aren't snapshotted — see the scope note below)
- publish status — ❌ not applicable in this bounded scope; every snapshot *is* a completed publish, there's no separate status to track

**The scope decision:** "Save" already *is* "Publish" in this app — `PUT /project/pages/:pageId` overwrites the exact document `by-slug`/`by-domain` serve live, unconditionally, with no draft/live split anywhere in the schema (`status` is a generation-lifecycle flag — `empty`/`generating`/`ready` — not a draft/live one). A real "Publish History" as specced assumes past versions exist to roll back to; today's model can't produce that. Asked the user: introduce a real draft/live split (new architecture — changes the save flow, the public read path, and how every save-dependent feature from Phases 2–6 behaves while "unpublished"), or keep save==publish exactly as it works today and add a lightweight audit trail instead. Chose the bounded option, consistent with the Phase 4/6 precedent.

**What shipped:** `backend/models/Version.js` — `pages` stored as `Mixed` (not the strict `pageSchema`), deliberately, since an archival snapshot doesn't need write-time validation and `Mixed` sidesteps the exact bug class (`strict: true` silently stripping undeclared fields) that has bitten `cmsBinding`, `productBinding`, and component-instance fields in earlier phases. `POST /project/version` captures the current live `pages` right before a publish overwrites them — called once, at the top of `handleSave` in `page.tsx`, fire-and-forget with its own error handling so a failed snapshot can never delay or break the real publish that follows. Capped at 25 versions per project, oldest pruned automatically. Not snapshotting menus/redirects/classes/tokens alongside pages was a deliberate scope cut — `pages` is where almost all real content lives, and including everything would have meant a heavier, riskier route on the hot save path for comparatively little benefit.

## Rollback — ✅ done, folds into the same bounded scope

```text
Version
 ↓
Restore
 ↓
Preview
 ↓
Publish
```

`POST /project/versions/:versionId/restore` writes a snapshot's `pages` back onto the live project and saves immediately — which already republishes, since that's what a save means in this app. "Preview" isn't a separate step: looking at the editor after a restore *is* the preview, because there's nothing further to publish until the next real edit. The frontend's `VersionHistoryPanel.tsx` requires an explicit confirm click before restoring, and does a full page reload afterward rather than trying to patch the editor's in-memory state (elements/frames/canvas state) piecemeal — simpler and safer than partial-state reconciliation for a deliberately rare, high-consequence action.

**A real bug caught by live-testing, not assumed away:** the snapshot route crashed (`TypeError: Cannot read properties of undefined (reading 'label')`) the first time it was tested with the exact request shape the real frontend sends — `handleSave` posts with no request body at all, and Express leaves `req.body` `undefined` (not `{}`) for a bodyless request, so `req.body.label` threw before the snapshot could be written. Fixed with optional chaining across all three new version routes, then re-verified with a real snapshot → modify-a-page → restore round-trip against the live dev database, confirming the exact original content came back.

## Forms — ✅ done

Components:
- input — ✅ already existed as an `HTMLTag`, insertable via AddPanel
- textarea — ✅ already existed
- email — ✅ (an `input[type=email]`, already the AddPanel default for one field)
- phone — ✅ (`input[type=tel]`, now selectable via the new Input-type control)
- select — ✅ already existed
- checkbox — ✅ now selectable via the new Input-type control (wasn't reachable in any UI before)
- radio — ✅ now selectable via the new Input-type control
- file — ✅ now selectable via the new Input-type control
- date — ✅ now selectable via the new Input-type control
- submit — ✅ already existed (`button[type=submit]` in the form preset)

Configuration:
- validation — ⚠️ `required` only, as a real HTML boolean attribute — no pattern/min-length/custom validation
- required fields — ✅ done (a toggle in `CanvasPropertiesPanel.tsx`, writes a real `required` attribute)
- success state — ✅ done (an inline toast from `FormSubmitHandler.tsx`, not a redirect)
- error state — ✅ done (same toast, red instead of green, with the server's own message when available)
- email notification — ✅ done (reuses the exact `backend/lib/email.js` pattern already established for welcome/payment/password-reset emails)
- stored submissions — ✅ done (`FormSubmission` model, an owner-only inbox panel)

Before this phase, a `"form"` element (and input/textarea/select) already existed in the type system and was insertable from `AddPanel.tsx` — but was purely decorative: `generateHTML.ts` had no submit handling at all, and there was no backend anywhere a *user's own site* could send a submission to. (`backend/models/Lead.js`/`routes/leads.js` exist, but are LHRWEB-the-company's own hardcoded marketing-site contact form — no `projectId` field, not usable by builder users for their own sites.) Built: `backend/models/FormSubmission.js` (`projectId`/`pageId`/`formId`/`data: Mixed`/`read`), a public unauthenticated `POST /api/forms/public/:projectId` (payload-sanitized: capped field count and per-value length), and an owner-only `GET/PATCH/DELETE /api/forms` inbox. On the public site, `FormSubmitHandler.tsx` mirrors Phase 3's `CartWidget.tsx` precedent exactly — the only other piece of real client-side interactivity on an otherwise-static published site, using plain DOM `submit`-event delegation (form markup ships via `dangerouslySetInnerHTML`, outside React's own tree) rather than React's `onSubmit`. The default form preset in `AddPanel.tsx` never set `name` attributes on its inputs at all before this — fixed, since a submission with no field names is meaningless.

## Accessibility — ✅ done, static scan

Support/check:
- alt text — ✅ done
- heading hierarchy — ✅ done (skipped levels + duplicate `<h1>`s)
- labels — ⚠️ approximated as "has a placeholder or aria-label" — this authoring model has no `<label for>` linking mechanism to check directly
- keyboard focus — ❌ not built (would need real focus-order analysis, out of this phase's bounded scope)
- contrast — ✅ done, WCAG relative-luminance ratio — only for elements with both `color` and `backgroundColor` explicitly set as hex (nothing is guessed from an unresolved CSS cascade)
- link labels — ✅ done (an `<a>` with no visible text and no `aria-label`)
- semantic elements — ❌ not built (no check for "this should be a `<button>` not a styled `<div>`," out of scope)

Built as a pure, unit-tested function (`frontend/lib/a11yCheck.ts`) over `ElementNode[]` data already on hand — no schema or save-path changes. Surfaced in a new "Audit" tab's Accessibility sub-panel. Two items (keyboard focus order, semantic-element misuse) were left out rather than half-built — both would need real interaction/DOM-role analysis beyond a static tree scan, judged out of proportion to this phase's bounded scope.

## Performance — ✅ done, static heuristics not real field data

Check:
- image size — ✅ done (reuses `Asset.size`, already recorded by the Phase 6 asset library)
- image format — ✅ done (flags non-WebP/AVIF/SVG formats)
- oversized assets — ✅ done (>500KB threshold)
- render weight — ❌ not built
- script weight — ❌ not applicable — there is no user-authored JavaScript anywhere in a published site (the pen tool's inline SVG is the closest thing, and it isn't script)
- basic Core Web Vitals visibility — ⚠️ "basic" taken literally: static heuristics over already-recorded asset data, explicitly **not** real field-collected LCP/CLS/FID (that needs a beacon on the published site plus a collection endpoint — separately-scoped, materially larger work)

Built as a pure, unit-tested function (`frontend/lib/performanceCheck.ts`) that cross-references each project's uploaded assets (size/mimetype, already on record from Phase 6) against which of them a page's elements actually reference (`<img src>` or a `background-image: url(...)`), to flag oversized images, legacy formats, and — a small bonus this cross-reference makes free — assets uploaded but never used anywhere. Surfaced in the "Audit" tab's Performance sub-panel, alongside Accessibility.

## Exit Criteria

The five sub-areas are done as scoped above, with two deliberate forks (Publish History's bounded audit-trail choice, Performance's static-heuristics-not-real-CWV choice) explicitly decided and disclosed rather than silently incomplete. 27 new unit tests (contrast-ratio math, heading-skip detection including nested containers, empty-link/unlabeled-field detection, oversized/legacy-format/unused-asset detection including background-image references) — 125/125 passing. `tsc --noEmit` clean, a full `rm -rf .next && npm run build` clean. Publish History and Forms were verified end-to-end against the real dev database (a genuine snapshot → modify → restore round-trip; a real public form submission creating a real, listable, deletable record) — this is also where the `req.body` bug above was actually caught, not assumed safe. The Accessibility/Performance UI panels and the new form-field/image builder controls were not exercised by clicking through an actual browser — no browser-automation tool is available in this environment, the same disclosed limitation as Phase 6.

---

# 14. Phase 8 — Scale — ⚠️ partial by explicit choice (2026-09-03)

**The scope decision (round 1):** all three sub-areas below are new architecture — unlike Phases 4–7, none of them extend a mechanism this app already has. Asked the user how to approach a phase this large and disparate: minimal stubs for all three, docs-only for all three, or one built for real. Chose the third — Customer Analytics, built for real. Real-Time Collaboration was left fully unbuilt; Agency/White Label came back as a follow-up round, described in its own section below.

## Real-Time Collaboration — ❌ not started (deferred by explicit choice)

Potential architecture:

```text
Browser
  ↓
WebSocket
  ↓
Shared document / CRDT
  ↓
Other users
```

Candidate technology identified in the blueprint:
- WebSocket
- Yjs

Capabilities:
- multiple users
- presence
- cursors
- simultaneous editing
- conflict resolution
- comments

## Agency / White Label — ✅ done, full data-isolation retrofit

Formal tenancy:

```text
Platform
 └── Agency
      ├── Team
      ├── Client A
      ├── Client B
      └── Client C
```

Need:
- tenant ID — ✅ done (`Agency._id`, referenced by `User.agencyId` and `BuilderProject.agencyId`)
- agency roles — ✅ done, two roles: `owner` and `team` — treated as *equally* privileged over every agency project (no finer-grained permission tiers between them yet, e.g. "team can edit but not delete")
- client roles — ✅ done, `client` — gets no special access path at all; a client's own project already worked exactly like any independent user's, via plain direct `userId` ownership, so nothing needed to change for that case specifically
- permissions — ⚠️ coarse: owner-only for membership changes (invite/remove) and white-label settings; owner+team equally for everything project-scoped
- data isolation — ✅ done, a full retrofit (see below) — not just at the point a project is first opened
- white-label settings — ✅ done (logo URL, primary color, support email) — not yet actually *applied* anywhere visible (no white-labeled email sender, no branded login page) — the data model and CRUD exist, surfacing it further is future work

**The scope decision (round 2):** investigation found project ownership was checked with a direct `userId` match at roughly 90+ call sites across 6 route files (`builder.js` alone had ~75 of them). For an agency team member to actually *use* a client's project — not just see it open before every panel (CMS, commerce, assets, forms, analytics) 404s — that check needed to become agency-aware at nearly all of them, not just the entry point where a project is first opened or listed. Asked the user: a full mechanical retrofit via one shared authorization helper (larger, slower, but the feature genuinely works end-to-end), or a fast gateway-only version that would leave the feature looking built while immediately breaking on real use. Chose the full retrofit.

**What shipped:**
- `backend/models/Agency.js` — one owner, a name, and `whiteLabel: { logoUrl, primaryColor, supportEmail }`.
- `User.agencyId` / `User.agencyRole` (`"owner" | "team" | "client" | null`) and `BuilderProject.agencyId` — three small, additive schema fields, `null` by default, so an account or project untouched by any of this behaves exactly as it always has.
- `backend/lib/projectAccess.js` — the one shared helper (`resolveProject`, `listAccessibleProjects`) that encapsulates the actual access rule everywhere: a project is reachable by its direct owner (unchanged `userId` match) **or** by an `owner`/`team` member of the agency it's tagged with. The requester's own agency membership is looked up fresh from the database on *every call*, never trusted from a JWT claim — removing someone from an agency revokes their access immediately, not just once their existing token happens to expire.
- Every one of the ~90 call sites across `builder.js`, `commerce.js`, `cms.js`, `assets.js`, `forms.js`, and `analytics.js` was migrated to this helper, with each route's other behavior — exact error messages, `.lean()`/`.select()` usage, whether it needed a mutable Mongoose document to call `.save()` on — preserved exactly. Two files (`commerce.js`, `cms.js`) already had their own local `assertOwnsProject` helper; those were simply repointed at the shared one, a one-line change each. Files without a local helper had every individual call site swapped directly.
- A project created by an agency `owner`/`team` member auto-tags with that agency's `agencyId` (`init-manual`, `init-template`, and the AI `generate` route all do this) — a `client` (or any independent, non-agency user) creating their own project is completely unaffected.
- `backend/routes/agency.js` — create an agency (creator becomes its owner; a user can belong to at most one), `GET /` (agency info + team/client member lists), invite an *existing* registered account as team-or-client (no email-invite pipeline — attaching an existing account directly, like an admin action, rather than building a full signup-link flow, is a deliberate, disclosed scope cut), remove a member, edit white-label settings, and reassign a project's direct ownership (`userId`) to a specific client of the same agency.
- A new "Agency" section in the client dashboard (`AgencyPanel.tsx`) — create-agency flow, white-label form, team/client lists with remove buttons, an invite form. Project cards in "My Websites" show an "Agency" badge when a project's `agencyId` is set.

**A real bug caught while doing the retrofit, not assumed away:** `backend/routes/assets.js`'s delete route scoped deletion by both `projectId` *and* `userId: req.user.userId` on the asset record itself — so even after the surrounding ownership check became agency-aware, a team member still couldn't delete an asset a teammate (or the client) had uploaded, because the delete query independently re-checked the specific uploader. Fixed by scoping the delete to `projectId` alone, which the route's own middleware had already access-checked.

**Deliberately not built (disclosed, not silent):** no email-invite pipeline; no permission tiers between `owner` and `team`; removing a team member doesn't reassign projects *they personally created* under the agency (those keep their `agencyId` tag and the departing member's own direct ownership — a known limitation on offboarding, not a security gap, since the departing member simply keeps exactly the access they'd have had anyway as that project's direct owner); white-label settings aren't yet applied anywhere visible beyond the settings form itself (no branded outbound email, no branded login page).

**Verified end-to-end against the real dev database — not a mocked test:** created a real agency via the real API; invited a real second account as `team`; created a project as the owner and confirmed it auto-tagged with `agencyId`; as the **team member** (a distinct account, a distinct JWT), confirmed they could list the project, open it, save a real page edit, and reach CMS/assets/forms/analytics for it. As a genuinely unrelated third account, confirmed every one of those same calls correctly returned 404/null — the actual security property this retrofit exists to deliver — including on `DELETE /project/:id` itself. Assigned the project to a client account and confirmed both the client (direct ownership) and the team member (agency membership) retained correct access afterward. Removed the team member and confirmed their access was revoked immediately on their still-valid, unexpired token — proving the fresh-database-lookup design actually works, not just a stale-JWT-claim shortcut that would have looked identical in a shallower test. Removed the client and confirmed the project's `agencyId` cleared while `userId` correctly stayed with them (they keep their own site; the agency simply no longer manages it). All test users, the test agency, and the test project were deleted afterward; the pre-existing shared test project confirmed untouched throughout.

## Customer Analytics — ✅ done

Track:
- visitors — ✅ done (`AnalyticsEvent.visitorId`, a client-generated localStorage id — unique count via `distinct`)
- sessions — ✅ done (`AnalyticsEvent.sessionId`, sessionStorage — one per tab)
- page views — ✅ done
- referrers — ✅ done (`document.referrer`, top 10 surfaced)
- devices — ✅ done (mobile/tablet/desktop, classified client-side by viewport width at load)
- conversions — ✅ done, as the combination of the next two rather than a separate tracked event type — see note below
- form submissions — ✅ done (read directly from the Phase 7 `FormSubmission` model, not duplicated into a second tracking system)
- ecommerce events — ⚠️ order count + revenue only (read directly from the Phase 3 `Order` model) — not a full event funnel (no cart-add/checkout-start/checkout-abandon breakdown)

**What shipped:** `backend/models/AnalyticsEvent.js` (one record per real pageview) plus a public `POST /api/analytics/track` (called by a new `AnalyticsTracker.tsx` on the published site, `mode === "public"` only — a site owner's own preview visits don't pollute their own numbers — via `navigator.sendBeacon` so the request survives a fast navigation) and an owner-only `GET /api/analytics/summary` (date-range aggregation: total pageviews, unique visitors, unique sessions, top pages, top referrers, device breakdown, a daily time series, plus form-submission and order counts/revenue pulled live from their own existing models rather than re-tracked as separate analytics events — a submission or an order is already a complete, authoritative record of its own event, so duplicating it into `AnalyticsEvent` would just be two sources of truth for the same fact). Surfaced in a new "Analytics" tab (`AnalyticsPanel.tsx`): summary cards, a plain-div daily-pageviews bar chart (deliberately not a charting library — one chart doesn't justify a new dependency), a device-share breakdown, and top-pages/top-referrers tables, with a 7/30/90-day range selector.

**"Conversions" note:** the spec lists conversions, form submissions, and ecommerce events as three separate bullets. Built as two real, distinct counts (form submissions, orders/revenue) rather than inventing a third, generic "conversion" event type layered on top — a form submission and a completed order already *are* the two conversion types this product has; a separate abstract "conversion" tracking mechanism would have no third thing to actually measure yet.

**Verified against the real dev database:** unauthenticated summary access rejected (401); a track request missing required fields rejected (400); three real pageview events (two distinct visitors, two distinct sessions, two distinct pages, two distinct referrers, two distinct devices) tracked and every aggregate in the summary response — pageview count, visitor count, session count, per-page counts, per-referrer counts, device split — confirmed to match exactly; a real form submission confirmed to increment the summary's `formSubmissions` count via the live cross-model read. All test data cleaned up afterward, confirmed back to a zeroed baseline.

---

# 15. AI Expansion

The existing AI subsystem should remain the single AI architecture.

## Website Generation

```text
User Prompt
 ↓
Site Plan
 ↓
Pages
 ↓
Sections
 ↓
ElementNode
 ↓
Theme
 ↓
Content
 ↓
Website
```

## AI Editing

Examples:
- make this section modern
- change colors
- make responsive
- add pricing section
- convert to product card
- create blog page

## AI + CMS

AI should understand:
- collection schema
- fields
- relationships
- content

## AI + Ecommerce

AI should understand:
- products
- collections
- pricing
- storefront structure

## AI Output Rule

```text
Gemini
 ↓
Schema validation
 ↓
Repair
 ↓
Post-process
 ↓
ElementNode validation
 ↓
Builder
```

AI must not bypass the project model.

---

# 16. Runtime Architecture

The runtime must understand:
- normal elements
- components
- dynamic bindings
- CMS lists
- product lists
- responsive styles
- navigation
- forms
- ecommerce actions
- SEO metadata

Conceptually:

```text
BuilderProject
│
├── pages
├── components
├── tokens
├── classes
├── bindings
├── CMS configuration
├── ecommerce configuration
└── assets
        ↓
     Runtime
        ↓
   Published Site
```

---

# 17. Data Model Direction

Keep BuilderProject central.

Conceptually:

```text
BuilderProject
├── project metadata
├── pages[]
│   ├── structure
│   ├── elements[]
│   ├── SEO
│   └── route
├── components[]
├── classes[]
├── tokens[]
├── canvasState
├── bindings[]
├── navigation
├── forms
├── ecommerce configuration
└── AI memory
```

CMS entries and products should remain external data and be referenced through bindings rather than copied into every page.

---

# 18. API Boundaries

## Builder
- project CRUD
- page CRUD
- component CRUD
- save
- publish
- preview
- domain

## CMS
- collections
- fields
- entries
- publish/unpublish
- queries

## Commerce
- products
- collections
- cart
- orders
- checkout

## Assets
- upload
- list
- metadata
- delete

## Forms
- form configuration
- submissions

## Analytics
- tracking
- aggregation
- reports

---

# 19. Testing Strategy

Every phase requires tests.

## Unit tests

Test:
- data binding
- component resolution
- responsive calculations
- HTML generation
- CSS generation
- CMS queries
- product queries
- cart operations

## Integration tests

```text
CMS
 ↓
Binding
 ↓
Builder
 ↓
Renderer
```

and:

```text
Product
 ↓
Product Card
 ↓
Add Cart
 ↓
Checkout
```

## End-to-End

### Blank website

```text
Login → Create Project → Free Mode → Design → Preview → Publish → Live Site
```

### AI website

```text
Login → Prompt → AI Generation → Edit → Preview → Publish
```

### CMS website

```text
Collection → Entries → Page → Bind → Publish → Verify dynamic content
```

### Ecommerce

```text
Products → Storefront → Product → Cart → Checkout → Order
```

### Custom domain

```text
Add Domain → DNS → Verify → Publish → Open Domain
```

---

# 20. Definition of Done

A feature is complete only when:

1. Data model exists
2. API exists
3. Authentication/authorization is enforced
4. UI exists
5. Builder integration exists where applicable
6. Preview works
7. Published runtime works
8. Error states work
9. Loading states work
10. Undo/redo works where applicable
11. Save/recovery works
12. Responsive behavior works where applicable
13. AI understands it where applicable
14. Tests exist
15. Production build succeeds

---

# 21. Priority Plan

## P0 — Product completion

1. Builder state extraction
2. CMS management UI
3. Generic field-binding system
4. Dynamic CMS lists/pages
5. Products UI
6. Product bindings/cards
7. Storefront
8. Cart/checkout integration

## P1 — Professional builder

9. Master-linked components
10. Component variants
11. Component slots
12. Nested components
13. Website hierarchy
14. Global navigation
15. 404 and redirects
16. Responsive constraints
17. Auto Layout controls
18. Asset library

## P1 — Production completeness

19. Custom domain UI
20. SEO completion
21. Publish history
22. Rollback
23. Forms
24. Accessibility
25. Performance checks

## P2 — Scale

26. Customer analytics
27. Real-time collaboration
28. Agency tenancy
29. White-label
30. Advanced Core Web Vitals tooling

---

# 22. Dependency Graph

```text
Builder State Architecture
        ↓
CMS Management
        ↓
Generic Data Binding
        │
   ┌────┴─────────┐
   ↓              ↓
CMS Lists      Products
   ↓              ↓
Dynamic Pages  Product Cards
                  ↓
             Cart/Checkout


Components
   ↓
Master
   ↓
Variants
   ↓
Slots / Nested Components


Page Hierarchy
      ↓
Global Navigation
      ↓
404 / Redirects
```

Independent work can proceed in parallel:

```text
Custom Domains
SEO
Draw Modifiers
Guides
Advanced Styling
Asset Library
Accessibility
Forms
Publish History
```

---

# 23. Parallel Development Tracks

## Track A — Builder
- state extraction
- canvas
- responsive
- components
- styling

## Track B — CMS/Data
- collections
- entries
- bindings
- dynamic lists

## Track C — Commerce
- products
- collections
- product pages
- cart
- checkout

## Track D — Platform
- domains
- publishing
- versions
- SEO
- analytics

## Track E — AI
- generation
- editing
- CMS-aware generation
- ecommerce-aware generation

All tracks integrate through the shared project model.

---

# 24. Release Milestones

## Milestone 1 — Builder Production Ready

Customer can:
- create a project
- use Flow
- use Free Mode
- use AI
- design
- preview
- publish
- use a custom domain

## Milestone 2 — Dynamic Websites

Customer can:
- create collections
- create entries
- bind fields
- create dynamic lists
- create dynamic pages
- publish dynamic content

## Milestone 3 — Ecommerce

Customer can:
- create products
- design product cards
- create storefronts
- manage cart
- complete checkout
- receive orders

## Milestone 4 — Professional Design System

Customer can:
- create master components
- create variants
- use slots
- build responsive layouts
- use advanced styling
- manage assets

## Milestone 5 — Production Operations

Customer can:
- manage versions
- rollback
- manage forms
- configure SEO
- improve accessibility
- monitor performance

## Milestone 6 — Scale

Platform supports:
- analytics
- agencies
- white-label
- collaboration

---

# 25. Final Customer Journey

```text
1. Register
       ↓
2. Subscribe
       ↓
3. Create Website
       ↓
4. Choose:
      ├── Template / Flow
      ├── Blank / Free Mode
      └── AI
       ↓
5. Build Website
       ↓
6. Create Pages
       ↓
7. Create CMS / Products
       ↓
8. Bind Data
       ↓
9. Make Responsive
       ↓
10. Configure SEO
       ↓
11. Preview
       ↓
12. Publish
       ↓
13. Connect Domain
       ↓
14. Manage Content / Orders
       ↓
15. Analyze Website
```

---

# 26. Final Architectural Principle

Preserve this chain:

```text
USER INTENT
    ↓
FLOW / FREE / AI
    ↓
ElementNode
    ↓
Project Model
    ↓
Data Binding
    ↓
Responsive/Layout Resolution
    ↓
Renderer
    ↓
Preview
    ↓
Published Runtime
```

The objective is not to build separate systems for Flow, Free, AI, CMS websites, and ecommerce websites.

All of them should produce and consume the same project/runtime model.

---

# 27. Immediate Implementation Sequence

The highest-value next sequence is:

```text
1. Extract builder state
        ↓
2. Build CMS management UI
        ↓
3. Build generic field-binding architecture
        ↓
4. Bind text/image/link elements
        ↓
5. Build CMS List
        ↓
6. Build dynamic CMS pages
        ↓
7. Reuse binding system for Products
        ↓
8. Build Product Card
        ↓
9. Build storefront
        ↓
10. Integrate Cart + Checkout
        ↓
11. Build master-linked components
        ↓
12. Complete website hierarchy/navigation
        ↓
13. Complete responsive/Auto Layout system
        ↓
14. Add operations, forms, accessibility and performance
        ↓
15. Add analytics, collaboration and agency/white-label
```

## Completion Goal

The finished LHRWEB product should let a customer go from:

**subscription → website idea → AI/template/blank canvas → visual design → CMS/ecommerce data → responsive website → SEO → preview → publish → custom domain → ongoing content/order management.**
