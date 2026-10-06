# LHRWEB — Master Project Blueprint

**What exists → what's partial → what's missing → dependencies → build order.**

This is the synthesis of `STRUCTURE.md` (how it's built) and `STATUS.html` (what's verified) into one forward-looking plan. Read `STATUS.html` for file-level evidence behind every claim here — this document adds the piece neither of those had: **what blocks what, and in what order to build it.**

---

## 1 · What LHRWEB is

> LHRWEB is a SaaS website platform where customers subscribe, create and manage websites through Flow Mode, Free/Figma Mode, or AI, connect those websites to CMS and ecommerce data, and publish them to LHRWEB subdomains or custom domains.

```
Platform → Project → Website Structure → Builder → Data → AI → Renderer → Published Website
```

```
                    LHRWEB PLATFORM                          CLIENT WEBSITE PROJECT
                          │                                          │
            ┌─────────────┼─────────────┐              ┌────────────┼────────────┐
            │             │             │              │            │            │
          Admin         Users        Billing        Builder        CMS       Commerce
            │                          │                │
          Sites                     Stripe        ┌──────┼──────┐
          Leads                     Plans          │      │      │
          Content                                 Flow   Free    AI
                                                    │      │      │
                                                    └──────┼──────┘
                                                           │
                                                           ▼
                                                   ElementNode[]
                                                           │
                                              generateHTML() + generateCSS()
                                                           │
                                                           ▼
                                                   PUBLISHED WEBSITE
```

**The foundational decision that makes this workable:** one `ElementNode` data model shared by all three ways of creating content (Flow editor, Free/Figma canvas, AI generation), converging on one render pipeline. Nothing below this line requires touching that decision — every gap identified is an *integration* problem, not a *foundation* problem.

---

## 2 · What exists (verified)

Condensed from `STATUS.html`. Full evidence there.

| Area | Status |
|---|---|
| Platform — public site, customer auth, dashboard, admin panel, Stripe billing | ✅ done |
| Builder core — canvas manipulation, multi-select, groups, rotation, aspect-lock, layers panel, design tokens, breakpoints | ✅ done |
| Color/type — HSB picker + eyedropper, font picker, solid/gradient/image fills | ✅ done |
| Auto Layout — frame-level (`layoutMode`) and selection-level (⇧A), both publish correctly | ✅ done |
| Components — create / swap / detach (copy-based) | ✅ done |
| Convert to… — Section / Hero / Navbar / Footer | ✅ done |
| Publish pipeline — Free canvas → `page.elements[]` → live site | ✅ done |
| AI engine — generation, rewrite, SEO, theme, validation, repair, quotas, circuit breaker, async jobs, eval harness | ✅ done — the strongest subsystem in the codebase |
| Commerce & CMS — models + routes (`Product`, `Order`, `Cart`, `Collection`, `CmsCollection`, `CmsEntry`) | ✅ done, backend only |
| Page management, undo/redo, preview workflow, billing UI | ✅ done |

---

## 3 · What's partial (small unlock, real value)

| Item | What's there | What's missing | Effort to close |
|---|---|---|---|
| **Custom domain** | Both backend routes (set + DNS verify) fully work | Zero frontend UI calls them | **Trivial** — one settings screen |
| **SEO** | Per-page title/description/keywords + AI-assist | Sitemap, robots, canonical URL, OG image, structured data | Small — extends the existing panel |
| **Site navigation** | Per-block nav-link editor (`NavItemsEditor.tsx`) | No global site-wide menu manager | Medium |
| **Asset management** | Upload endpoint works (`routes/upload.js`) | No browse/reuse library panel in the builder | Medium |
| **Analytics** | Admin-level platform stats | No per-site visitor analytics for customers | Medium — needs new tracking + model |
| **Reparent-on-drop** | Hit-testing works for placing *new* elements into a frame | No live-highlight reparenting of *existing* elements | Small |

---

## 4 · What's missing — grouped by dependency, not by category

This is the reordering that matters. `STATUS.html`'s 13 missing items look like a flat list; they aren't — several are hard prerequisites for others.

```
                         ┌─────────────────────────┐
                         │   CMS management UI     │
                         │ (create/edit collections │
                         │      & entries)          │
                         └────────────┬────────────┘
                                      │ unlocks
                                      ▼
                         ┌─────────────────────────┐
                         │  Field-binding picker    │◄──────────┐
                         │ (canvas element ↔ field) │            │ shares the
                         └────────────┬────────────┘            │ same picker
                          unlocks     │      unlocks             │ component
                    ┌─────────────────┴─────────────┐            │
                    ▼                                ▼            │
         ┌─────────────────────┐          ┌─────────────────────┐│
         │ Convert to CMS List │          │Convert to Product Card││
         │ Dynamic CMS pages   │          │ Product/collection    ││
         └─────────────────────┘          │ pages                 ││
                                           └───────────┬──────────┘│
                                                        │           │
                                           ┌────────────┘           │
                                           ▼                        │
                                ┌─────────────────────┐             │
                                │   Products panel     │─────────────┘
                                │ (create/edit product) │
                                └───────────┬───────────┘
                                            │ unlocks
                                            ▼
                                ┌─────────────────────┐
                                │ Cart/checkout builder │
                                │    integration        │
                                └─────────────────────┘


         ┌─────────────────────┐
         │ Master-linked        │
         │ component instances  │
         │ (real override        │
         │  resolution at render)│
         └───────────┬───────────┘
                      │ unlocks
          ┌───────────┼───────────┐
          ▼           ▼           ▼
   Edit master    Variants     Slots / nested
   propagation                 live components


         ┌─────────────────────┐
         │  Nested routes /     │
         │  page hierarchy      │
         └───────────┬───────────┘
                      │ makes complete
                      ▼
         ┌─────────────────────┐
         │ Site navigation /     │
         │ global menu manager   │  (partial today — per-block only)
         └───────────┬───────────┘
                      │ makes complete
                      ▼
         ┌─────────────────────┐
         │  404 / redirects     │
         └─────────────────────┘
```

**Independent — no upstream dependency, can be built any time:**
Custom domain UI · SEO completeness (sitemap/robots/canonical/OG) · draw modifiers (Shift/Alt) · ruler guides · stroke position & per-side borders · multi-shadow/blur · Auto Layout panel UI (9-cell grid, Fixed/Fill/Hug) · resize constraints · asset library · accessibility controls · form builder · publish history/rollback · performance checks.

**Late-stage / P2, real infrastructure work, not gaps in the core product:**
Real-time collaboration (needs WebSocket/Yjs — no dependency exists today) · agency/white-label (needs a tenancy model) · Core Web Vitals tooling.

---

## 5 · One structural risk worth naming now

`app/builder/page.tsx` is 4,100+ lines and owns state, save orchestration, AI calls, CRUD, and view routing across three overlapping editor systems (Flow/V1, Flow/V2, Free canvas). It works today. It would not have degraded gracefully once CMS binding, commerce binding, forms, deeper SEO, publish history, and AI-assisted editing all land on top of it in the phases below.

**Status: done (2026-09-02).** Rather than leaving this as a flagged risk, it was executed as Phase 0 — see the entry below. This was **not** a rewrite — the data model and render pipeline were already sound, and the fix was additive: three state slices (selection, save orchestration, canvas-mode) were extracted into dedicated hooks under `app/builder/hooks/`, with each hook's returned property names matching the original local variable names exactly, so the dozens of existing call sites throughout `page.tsx` kept working unchanged. `page.tsx` no longer owns those three state categories directly.

---

## 6 · Build order

Phases are sequenced by dependency first, effort-to-value second. Nothing here is a fixed deadline — it's the order that avoids rework.

### Phase 0 — State-architecture checkpoint — ✅ done (2026-09-02)
See §5. Extracted selection/save/canvas-mode state out of `page.tsx` into `app/builder/hooks/useSelectionState.ts`, `useCanvasModeState.ts`, and `useSaveOrchestration.ts`. Verified: `tsc --noEmit` clean, production build (`next build`) clean with the full route manifest including `/builder`, and a new Vitest + React Testing Library test suite (`frontend/app/builder/hooks/*.test.ts`, 10 tests) covering selection clearing, canvas-mode defaults/updates, and save-orchestration recovery-snapshot read/write/expiry logic — all passing. This also stood up frontend test infrastructure from scratch (previously none existed): `vitest.config.mts`, `npm test` script, `vitest`/`@vitejs/plugin-react`/`jsdom`/`@testing-library/react` added as devDependencies.

### Phase 1 — Free wins (no dependencies, immediate value) — ✅ done (2026-09-02)
- Custom domain settings screen (backend already works)
- SEO completeness: sitemap.xml, robots.txt, canonical URL, OG image fields
- Draw-tool modifiers: Shift-square/circle, Alt-from-center; draggable ruler guides

**Why first:** zero technical risk, closes the gap between "the backend supports this" and "a customer can actually use it," and SEO/domains are what makes a site feel production-ready.

**What actually happened:** this phase was *not* zero technical risk in practice — before any of the three planned items could matter, live testing (see `STATUS.html`'s "The published site didn't actually publish" chapter) turned up that the public site-serving path itself was broken in three compounding ways (custom domains 404'd outright, subdomains resolved by the wrong lookup, and the V2 `elements` render pipeline was never wired to any public route at all). That was fixed first, then the three Phase 1 items landed on top of a renderer that actually works. Two pre-existing runtime bugs in `generateCSS.ts`/`generateHTML.ts` (unguarded access to fields real production documents don't always have) were also caught and fixed by this testing, not by inspection.

### Phase 2 — CMS foundation — ✅ done (2026-09-02)
- CMS management UI: create/edit collections and entries
- Field-binding picker: connect a canvas element to a collection field

**Why here:** everything downstream in commerce and dynamic content depends on this. Building it once, well, pays for both CMS and Commerce.

**What actually shipped:** a "Data" tab (new in both the Flow-mode rail and the Free-canvas panel toggle) backed by `CmsPanel.tsx` — collection create/delete, field add/edit/delete/reorder, and entry create/edit/delete/duplicate/publish-toggle/search/paginate, all against the CMS backend that already existed but had zero UI before this. `BindDataModal.tsx` is the field-binding picker: pick a collection → a compatible field → a specific entry, stored as `cmsBinding: { collectionId, entryId, field }` on the `ElementNode` (a schema gap — `elementSchema` silently stripped unknown fields — was fixed to persist it). A new public, no-auth `GET /api/cms-collections/public/:projectId` plus a pure `resolveCmsBindings()` helper resolve bindings into real content at publish time; wired into `PublicSiteView` so the *live public site* actually shows bound CMS values — verified end-to-end against a real project (create collection → entry → bind → confirm the rendered `<h2>` shows the CMS value, not the placeholder → clean up).

Three deliberate scope cuts, honestly: (1) binding only applies to Free-canvas `ElementNode` elements, not Flow/V1 `blocks` — the two are genuinely different data models and Flow mode doesn't use `ElementNode` at all; (2) a binding targets one specific *entry*, not "this collection's field, resolved per page" — there's no per-page CMS-entry context yet, that's Phase 3's "Dynamic CMS pages"; (3) the *editor canvas* still shows the authored placeholder text, not the live-resolved value — only the published site resolves bindings, to avoid the content-editing feedback loop that live-substituting into the editable Content field would create. The underlying 6-type field-type ceiling (no reference/multi-reference/select/file/URL/email) from the original gap analysis is unchanged — this phase built the management UI and binding mechanism on top of the existing 6 types, it didn't expand them.

### Phase 3 — Data-bound builder — ✅ done (2026-09-02), commerce built on Stripe Connect
- Convert to CMS List, Dynamic CMS pages (unlocked by Phase 2) — ✅ done
- Products panel (create/edit products — can reuse the Phase 2 field-binding picker) — ✅ done
- Convert to Product Card, product/collection storefront pages — ✅ done
- Cart/checkout builder integration — ✅ done, Stripe Connect (destination charges)

**Why here:** this is the single biggest gap in the product — a fully-built backend with no way to reach it. It's also where `page.tsx` state pressure will show up first; do Phase 0 before or at the start of this phase if you're doing it at all.

**The payment-model decision:** investigation before starting found `Product`/`Collection` models and CRUD routes already exist, but `Cart`/`Order` had zero routes, and there was no payment-processor integration for storefront commerce at all (Stripe was wired only for the unrelated SaaS subscription-billing flow) — `backend/routes/commerce.js`'s own header comment said as much. Real checkout needs a payment-approach decision that's a business call, not an engineering default — asked the user, who chose **Stripe Connect**: each project owner connects their own Stripe account, payouts go directly to them, the platform takes an application fee (5%, `PLATFORM_FEE_BPS` in `commerce.js` — the one number in this whole feature worth revisiting before real launch).

**What actually shipped:**
- **CMS half** — "Convert to CMS List" (`cmsList` query on a container `ElementNode`, `CmsListModal.tsx`) and "Dynamic CMS pages" (`cmsTemplate` on a page, `CmsTemplateModal.tsx`, rendered at `/<pathPrefix>/<entry-slug>` via the `[[...rest]]` catch-all routes from Phase 1). `CmsBinding.entryId` became optional — omitted, it resolves from context (the current list iteration, or the entry a dynamic page renders).
- **Commerce half** — the same pattern, mirrored for products: `ProductsPanel.tsx` (products + collections management on the pre-existing backend), `BindProductModal.tsx`/`productBinding` ("Convert to Product Card" — image/name/price/compare-price/availability/URL), `ProductListModal.tsx`/`productList` ("Convert to Product List"), a plain-boolean `addToCart` marker, and `productTemplate` for product detail pages at `/<pathPrefix>/<product-slug>`. `resolveProductBindings.ts` (a second, parallel resolver to `resolveCmsBindings.ts`) does the actual substitution.
- **Real Stripe Connect wiring** in `commerce.js`: `POST /connect/:id/onboard` (creates an Express account + onboarding link), `GET /connect/:id/status`, a public cartToken-keyed cart (`POST/GET/PUT/DELETE /cart/...`, no auth — same trust model as the site itself), `POST /checkout` (destination charge with `application_fee_amount` + `transfer_data.destination`), and a webhook (`checkout.session.completed` → `processCheckoutSessionCompleted()`, `account.updated` → `processAccountUpdated()`) mounted with raw-body parsing before `express.json()`, mirroring the existing subscriptions webhook exactly. Orders are created **only** by the webhook, never by the checkout route itself.
- **The one piece of real client-side interactivity anywhere on the published site**: `CartWidget.tsx` — a floating cart badge + drawer using plain DOM event delegation on `[data-add-to-cart]` (since those elements are injected via `dangerouslySetInnerHTML`, outside React's own tree), driving the real cart API and redirecting to Stripe Checkout.

**Verification, and its real limit:** `STRIPE_SECRET_KEY` in this dev environment is a documented placeholder (`sk_test_REPLACE_WITH_YOUR_KEY`), confirmed by a real failed API call — so the Stripe-API-dependent paths (account creation, checkout session creation) are structurally correct against Stripe's documented API and mirror the already-working subscriptions integration, but were **not exercised against a live Stripe sandbox**. Everything else was: created real products, wired a product list + product detail page + Add-to-Cart buttons, confirmed the published site correctly repeated/sorted/filtered products and resolved every binding; ran the full cart lifecycle (create → add → update qty → remove) against the real API; called the webhook's order-creation logic directly with a synthetic Stripe session object against the real database and confirmed order creation, inventory decrement, cart cleanup, and idempotency (a redelivered event doesn't double-create); confirmed `/connect/*` and `/checkout` fail cleanly (no crash, clean error) against the placeholder key. Two real bugs were caught this way, not by inspection: `productBinding`/`productList`/`addToCart` were never added to `elementSchema` (same class of bug as Phase 2's `cmsBinding` miss — silently stripped by Mongoose's `strict: true`), and separately, `productList: {}` and `addToCart: {}` — both legitimate "use defaults / use context" states — were being silently deleted by Mongoose's `minimize` option, which removes empty sub-objects on save; fixed by making `addToCart` a plain boolean and giving `ProductListQuery.collectionId` a required (nullable) key, then re-verified against real data.

### Phase 4 — Real component system — ✅ done (2026-09-02), bounded scope by design
- Master-linked instances (live override resolution at render, replacing today's copy-based components) — ⚠️ bounded, see below
- Edit-master propagation — ✅ done, and a real data-loss bug fixed along the way
- Variants, slots, nested live components — ✅ done

**Why here, not earlier:** it's self-contained (doesn't block or get blocked by Phases 2–3), but it's a genuine architecture change to the component model — worth doing once state pressure from Phase 3 is already understood, not before.

**The scope decision:** investigation found the existing component system is already copy-based-plus-manual-push (an "Update Master + Push to Instances" button), and that push had a real bug — it did a blind full-tree replace on every instance, silently destroying any instance-specific customization (a button instance's own text, an image's own src). Full spec compliance ("instances store only componentId + overrides, no embedded structure, a resolver merges master+overrides everywhere") would mean rearchitecting how elements are stored and read across selection, drag/resize, the properties/layers panels, undo/redo, and the publish pipeline — real regression risk to a lot of working editor code. Asked the user: build a bounded version instead — fix the actual bug and add real override-preserving propagation, without touching how elements are stored.

**What actually shipped:** components stay full element trees per instance (not stub references) — the storage format, `FreeCanvas`/`FreeElement` rendering, the properties/layers panels, and the publish pipeline are all untouched. What's new: `ProjectComponent.slotPaths` — comma-joined child index-paths a component author marks as "Slot" from the properties panel; a slot's whole subtree is preserved from each instance's own current content across a master push instead of being overwritten, fixing the data-loss bug directly. `ProjectComponent.variants` — named alternate root structures (Button: Primary/Secondary/…), saved from an instance's current content, switchable per-instance; a push only ever touches instances on the *same* variant as the one being pushed from, so variants evolve independently. Nested components fall out of the existing full-tree storage for free: a nested instance inside a slot survives untouched (the slot isn't touched by the push); one outside a slot syncs with its parent's push like any other content, and has its own independent master/push relationship regardless of nesting depth. All the actual merge/path logic lives in a new pure, unit-tested module, `frontend/lib/componentInstances.ts` (14 tests) — kept separate from the (large, already-risk-managed) `page.tsx` specifically so the algorithm could be verified in isolation.

**A second, unrelated bug fixed along the way:** `componentId` itself — along with `label`, `layout`, `locked`, `hidden`, and `animation` — had never been added to the backend's `elementSchema` at all, meaning any top-level page element carrying those fields had them silently stripped on every save (Mongoose's default `strict: true`). This is the same class of miss as Phase 2's `cmsBinding` and Phase 3's `productBinding`, just older and wider — fixed by adding all six fields, then verified end-to-end: saved a real instance element with every one of those fields set, reloaded the project, confirmed all six survived exactly.

### Phase 5 — Site structure — ✅ done (2026-09-02)
- Nested routes / page hierarchy — ✅ done
- Global site navigation / menu manager (upgrading today's per-block editor) — ✅ done
- 404 handling and redirects — ✅ done, with a documented HTTP-status tradeoff

**Why here:** each depends on the one before it in the diagram above; doing them together avoids building the menu manager twice.

**Investigation first:** before writing code, confirmed (via a dedicated exploration pass) that zero hierarchy/global-nav/404/redirect concepts existed anywhere in `BuilderProject` — the only existing "Menu" model belongs to a completely separate legacy agency-site admin system and isn't reusable — and that the blast radius of adding real nested paths was confined to a handful of call sites, with working precedent already set by Phase 3's dynamic-CMS/product pages (real-path-first, `?slug=`-fallback coexistence). That confirmed the work was tractable without another scope-fork `AskUserQuestion`, unlike Phases 3 and 4.

**What actually shipped:** `Page.parentId` + `computePagePath()`/`resolvePageByPath()` in `frontend/lib/publicSite.ts` give every page a real nested URL (`/services/web-design`), cycle-guarded and matched before the legacy `?slug=` fallback; `canonicalUrlFor()` and the sitemap use these real paths now, not query strings. `Menu`/`MenuItem` (one level of nesting, page-or-URL targets, visibility) let a menu literally named "Header" (case-insensitive) replace the default "list every page" nav — `PublicSiteView.tsx` renders it with a hover dropdown (desktop) / indented list (mobile). `Redirect` (source/destination/301|302/enabled) and `notFoundPageId` round out the set, both editable from a new "Site" tab in the builder (`SitePanel.tsx`, `MenusPanel.tsx`, `RedirectsPanel.tsx`, `PageParentModal.tsx`). Backend: `PUT /project/menus`, `PUT /project/redirects`, `notFoundPageId` on `PUT /project/settings`, and `parentId` on `PUT /project/pages/:pageId` with real cycle detection (walks the ancestor chain, rejects with a 400 if the new parent is the page's own descendant — verified against a real API call).

**A bug caught before shipping, not after:** the initial nav-link design assumed the existing `hrefBase`-prefixed link pattern could just extend to nested paths uniformly. Reasoning through `middleware.ts`'s subdomain rewrite first (`url.pathname = /site/${subdomain}${pathname}`) surfaced that this would double-prefix paths for real subdomain/custom-domain visitors — the rewrite would fire a second time on top of an already-prefixed link, landing on garbage and silently falling back to the homepage. Fixed with a mode-aware `pageHref()`: `preview` mode (accessed via `/site/<id>`) prefixes with `hrefBase`; `public` mode (a real subdomain/custom-domain visit) uses clean root-relative paths, since the browser's origin already *is* the customer's site. Verified via curl against both modes before considering it done.

**A real bug found *during* redirect verification, not assumed away:** curl-testing a configured redirect returned 200, not the expected 307/308, even though the resolver correctly matched the rule. Root cause: `site/[projectId]/[[...rest]]/page.tsx` sits below `app/(frontend)/loading.tsx`, whose Suspense boundary flushes a 200 shell to the client before the async page component (which calls `redirect()`) resolves — by the time `redirect()` throws, the initial HTTP status is already sent. (Confirmed this affects Next's default `notFound()` too, not just custom redirects — same root cause. The RSC payload does carry the redirect instruction, so a real browser still soft-navigates after hydration; only the top-level HTTP status, and therefore SEO/crawlers/non-JS clients, is affected.) **Fixed properly, not worked around:** redirect resolution moved to `middleware.ts`, which runs pre-render with no streaming involved — it now fetches the target project's redirect rules directly (subdomain, custom domain, and internal `/site/<id-or-slug>/...` preview paths all covered) and returns a genuine `NextResponse.redirect()` with a real 307/308. Re-verified after the fix: 301→308 permanent, 302→307 temporary, a disabled rule doesn't fire, and normal (non-redirected) pages are unaffected.

**A second real bug found the same way:** `resolvePageAndContext`'s final fallback treated *any* unmatched path as "render the homepage" — meaning `notFound: true` was structurally unreachable for a plain bad URL with no `?slug=`, so the custom-404 feature (and Next's own default not-found) could never fire at all. Fixed: a non-empty `rest` path that matches nothing (no dynamic CMS/product template, no hierarchy page) and carries no `?slug=` now correctly reports `notFound: true`; the bare root and legacy `?slug=`-driven links are unaffected (existing tests for those kept passing; the one test that had encoded the old, wrong fallback behavior was rewritten to match the fix, plus two new tests for the root-path and `?slug=`-alongside-a-bad-path cases). Re-verified against the live dev database: a genuinely missing path now renders the configured custom-404 page's real content.

**The one deliberately accepted tradeoff:** even after both fixes, a not-found resolution (custom page or Next's default) still renders at **HTTP 200, not a real 404** — the *content* is correct (the configured page, or Next's own "page could not be found" UI), only the status code is stuck, for the identical streaming-boundary reason redirects had. Redirects were worth the middleware move because a wrong status there silently breaks the feature entirely (no redirect happens); a 404 rendering the right content at the wrong status is a real but survivable SEO issue (a "soft 404"), and fixing it properly would mean duplicating full page/CMS/product resolution into middleware — a much larger, higher-risk undertaking than this phase's bounded scope calls for. Documented directly in the builder UI (an amber warning in the "Site → 404" tab, covering both the custom and default case) and here.

### Phase 6 — Builder polish — ✅ done (2026-09-02)
- Stroke position, per-side borders, multi-shadow, blur/backdrop-filter — ✅ done
- Auto Layout panel UI (9-cell align grid, Fixed/Fill/Hug sizing) — ✅ done
- Resize constraints, linked Desktop/Tablet/Mobile frames — ✅ done, bounded scope by explicit choice
- Asset/media library panel — ✅ done

**Why here:** all independent, all pure builder-quality improvements — sequenced after the data/structure work because none of it is blocking, and by this point the product has real content to design *around*.

**Investigation first:** before writing code, a dedicated exploration pass established that resize constraints (pin/scale per axis) were *already* fully built and wired end-to-end from an earlier phase — nothing to do there but confirm and document. Auto Layout already had a real, working panel (mode switch, gap, padding, justify/align selects) — the gap was additive UI, not missing architecture. Styling fields (per-side border, per-corner radius, blur/backdrop-filter) mostly already existed on the `Styles` type but had no UI. The one item that genuinely forked into a scope decision was "linked Desktop/Tablet/Mobile frames": the Free canvas (Figma-style artboards) has zero relationship model between Frames — true linked variants would be new architecture (auto-generating Tablet/Mobile from a Desktop frame, propagating edits between them, mirroring Phase 4's master/instance system). Asked the user: chose the bounded option.

**The scope decision — Responsive Frames:** rather than a new Frame-family model, extended the *already-working* desktop/tablet/mobile per-breakpoint style-override mechanism (`ElementNode.styles.desktop/tablet/mobile`, previously wired only for Flow-mode pages) so Free-canvas Frame children can use it too. The save-side plumbing turned out to already be in place (the device switcher was already unconditionally visible, and `onStyleChange` already keyed writes by the active breakpoint) — the real gap was that the live canvas renderer (`FreeElement.tsx`, used by both `FreeCanvas.tsx` and `FrameContent.tsx`) only ever read `styles.desktop`, so editing a Tablet/Mobile override was write-only: it saved correctly and would apply correctly once published, but was invisible while editing it. Fixed by threading a `breakpoint` prop through `FreeElement`/`FrameContent`/`FreeCanvas` so the canvas merges in the active breakpoint's overrides live, the same way `Frame.tsx` already composites `frame.effects` into a live preview. No new Frame relationship model, no cross-frame propagation — exactly the bounded scope chosen.

**What actually shipped, beyond that:**
- **Styling** — per-side border width (a toggle reveals 4 width inputs, composed into the existing `borderTop/Right/Bottom/Left` shorthand fields, sharing one color/style), per-corner radius (same toggle pattern, `borderTopLeftRadius` etc.), a real multi-layer shadow list for elements (`Styles.boxShadowLayers`, reusing `Frame`'s own `FrameEffect` shape and composited the same way `Frame.tsx` already composites `frame.effects`), blur/backdrop-blur sliders, full text-decoration/text-transform selects (the existing pill buttons only ever toggled underline/uppercase), and multi-line truncation (`Styles.lineClamp`, expanded into the full `-webkit-line-clamp` declaration set — a single CSS property isn't enough on its own to truncate).
- **Auto Layout UI** — a real Figma-style 9-cell alignment grid (`AlignGrid9`) replacing the two separate Justify/Align selects for horizontal/vertical auto layout (grid mode keeps the selects — grid's `justify-items`/`align-items` don't share the same "one shared point" mental model), a flex-wrap toggle (previously hardcoded to `"wrap"` everywhere), and a grid-rows field alongside the existing grid-columns one — both wired into the live editor render (`FrameContent.tsx`) and the publish pipeline (`frameToElements.ts`) identically.
- **Asset library** — a new `Asset` model + `/api/assets` routes (list/upload/delete, auth-required, project-ownership-checked — reusing the existing Cloudinary-or-local upload middleware rather than a separate storage path), and `AssetLibraryPanel.tsx`/`AssetPickerModal.tsx` on the frontend: a standalone "Assets" tab (browse/upload/delete/search) plus a picker modal opened from an `<img>` element's new Source field or the background-image field's new "Browse…" button. The shared upload middleware's MIME allowlist was widened from images-only to also include video/font/PDF, matching the spec's Images/Videos/Files/Fonts categories (a small, additive change — existing callers only ever uploaded images, so nothing that worked before changed).

**Verified against the real dev database, not just a clean build:** the asset routes end-to-end (unauthenticated rejected with 401, a project the requesting user doesn't own rejected with 404 rather than leaking data, a real file upload creates a real `Asset` record with a genuinely servable URL, list reflects it, delete removes the record). Added 11 new unit tests for `stylesToCSS.ts`'s new compound-key logic (multi-shadow composition, hidden-layer exclusion, the plain-`boxShadow`-string fallback, and the full line-clamp declaration expansion) — 98/98 passing. `tsc --noEmit` clean and a full `rm -rf .next && npm run build` clean throughout.

**Honestly not verified:** the new UI controls themselves (the per-side/per-corner toggles, the shadow-layer list editor, the 9-cell align grid, the Assets tab, the image src/alt fields and picker modal) were not exercised by clicking through an actual browser — no browser-automation tool is available in this environment, the same limitation noted for Phase 1's ruler-guide drag interaction. They're verified by clean type-checking (which catches prop-wiring mistakes across the many files this phase touched) and a clean production build (which, for a statically-prerendered route like `/builder`, does execute the component tree once and would fail on a render-time crash) — not by confirming the interactions actually work as a user would experience them.

**Deliberately not built:** asset deletion removes the library record but not the underlying stored file (Cloudinary deletion needs the asset's `public_id`, not derivable from its URL alone without an extra lookup) — a known, disclosed limitation, not an oversight.

### Phase 7 — Operations — ✅ done (2026-09-02)
- Publish history / rollback — ✅ done, bounded scope by explicit choice
- Accessibility controls — ✅ done, static scan
- Form builder with stored submissions — ✅ done
- Performance / Core Web Vitals checks — ✅ done, static heuristics not real field data

**The scope decision — Publish History:** investigation found "Save" already *is* "Publish" in this app — the editor writes straight to the exact document the public site reads live (`PUT /project/pages/:pageId` overwrites it unconditionally; `by-slug`/`by-domain` read that same document), with no draft/live split anywhere. "Publish History" and "Rollback" as specced assume past versions exist to roll back to, which today's model can't produce. Asked the user: build a real draft/live split (new architecture, changes the save flow and the public read path), or keep save==publish exactly as-is and add a lightweight, append-only audit trail instead. Chose the bounded option — the same "fix the real gap, don't rearchitect working code" precedent as Phases 4 and 6.

**What actually shipped:** a new `Version` model captures a full snapshot of `pages` right before each publish overwrites them — triggered by one new, best-effort call (`POST /project/version`) added to the front of `handleSave`, which never touches the existing save path itself (zero risk to it). A capped history (25 per project, oldest pruned) is browsable in a new "History" tab (`VersionHistoryPanel.tsx`); "Restore" (`POST /project/versions/:id/restore`) writes an old snapshot's pages back and saves — which republishes immediately, since that's what save already means here. A real bug was caught by live-testing this against the dev database, not assumed away: the snapshot route crashed (`Cannot read properties of undefined (reading 'label')`) on exactly the call shape the real frontend makes — `handleSave` posts with no request body, and Express leaves `req.body` `undefined` rather than `{}` for a bodyless request, so `req.body.label` threw. Fixed with optional chaining, re-verified with a real snapshot → modify → restore round-trip against the live database, confirming the original content came back exactly.

**Forms:** a `"form"` element (and input/textarea/select field types) already existed in the builder's type system and was insertable, but was purely decorative — `generateHTML.ts` had no submit behavior at all, and there was no backend anywhere to receive a submission for a *user's own site* (the existing `Lead` model/routes are LHRWEB-the-company's own hardcoded marketing contact form, with no `projectId`). Built a real `FormSubmission` model + `/api/forms` routes (a public, unauthenticated submit endpoint plus an owner-only inbox), reusing the exact email-notification pattern already established in `backend/lib/email.js`. On the public site, a new `FormSubmitHandler.tsx` mirrors Phase 3's `CartWidget.tsx` precedent exactly — the second (and only other) piece of real client-side interactivity on an otherwise-static published site, using plain DOM `submit`-event delegation (form markup is injected via `dangerouslySetInnerHTML`, outside React's own tree) rather than `onSubmit`. Field name/required/input-type controls were added to `CanvasPropertiesPanel.tsx`, and the default form preset in `AddPanel.tsx` — which had never set `name` attributes on its inputs at all — now does, so a submission's payload is actually meaningful.

**Accessibility and Performance:** both built as pure, unit-tested functions (`lib/a11yCheck.ts`, `lib/performanceCheck.ts`) over data already on hand — no schema or save-path changes. Accessibility checks: missing `alt` text, heading-hierarchy skips and duplicate `<h1>`s, WCAG contrast ratio (only for elements with both `color` and `backgroundColor` explicitly set — nothing is guessed from an unresolved cascade), unlabeled form fields, and empty links. Performance reuses the Phase 6 asset library's already-recorded `size`/`mimetype` per upload, cross-referenced against which assets a page's elements actually reference, to flag oversized images, legacy (non-WebP/AVIF) formats, and unused assets — explicitly *not* real Core Web Vitals field data (that would need a beacon on the published site plus a collection endpoint, a materially larger, separately-scoped undertaking), and documented as such rather than implied to be more than it is. Both surfaced in a combined "Audit" tab (`AuditPanel.tsx`) with Accessibility/Performance sub-tabs — grouped together since both are read-only scan/report panels, distinct from History and Forms, which are operational data.

**Verified:** 27 new unit tests for the two pure check functions (contrast-ratio math against known hex pairs, heading-skip detection including nested containers, empty-link detection, oversized/legacy-format/unused-asset detection including background-image references) — 125/125 passing. `tsc --noEmit` clean (catching, among other things, a stale test in Phase 6's own `stylesToCSS.test.ts` that had drifted from the `Styles` type without vitest ever catching it, since vitest's transform doesn't type-check). A full `rm -rf .next && npm run build` clean. Publish History and Forms verified end-to-end against the real dev database (see above) — Accessibility/Performance UI panels and the new form-field/image builder controls were not exercised by clicking through an actual browser, the same disclosed limitation as Phase 6 (no browser-automation tool available here).

### Phase 8 — Scale — ⚠️ partial by explicit choice (2026-09-03): Analytics + Agency/White-Label done, Collaboration deferred
- Real-time collaboration — ❌ deferred, see the scope decision below
- Agency / white-label workflows — ✅ done, full data-isolation retrofit
- Customer-facing per-site analytics — ✅ done

**Why last:** each is a genuine infrastructure investment (WebSocket/CRDT, multi-tenancy, tracking pipeline) rather than a gap in the core product loop. Worth doing once there are customers whose usage justifies them.

**The scope decision (round 1):** unlike every phase before it, all three of Phase 8's sub-areas are *new* architecture — none of them extend a mechanism that already exists, the way Phases 4–7's bounded-scope choices did. Asked the user how to approach a phase this large and disparate: build all three as intentionally minimal stubs, document the architecture for all three without building, or build exactly one of them for real. Chose the third — Customer Analytics only, built as a genuine, working feature. Real-time collaboration was left fully unbuilt; Agency/White-Label came back as the next round's pick.

**What shipped (Analytics):** `backend/models/AnalyticsEvent.js` — one record per real pageview (`projectId`, `path`, `referrer`, `device`, `visitorId`, `sessionId`), written by a new public `POST /api/analytics/track`. On the published site, `AnalyticsTracker.tsx` fires once per real navigation in `mode === "public"` only (a site owner's own preview visits don't pollute their numbers) — using `navigator.sendBeacon` so the request survives a fast navigation, with a `visitorId` (localStorage, persists across visits) and `sessionId` (sessionStorage, one per tab) generated client-side. The owner-only `GET /api/analytics/summary` aggregates pageviews, unique visitors/sessions, top pages, top referrers, and a device breakdown over a selectable date range (7/30/90 days) — and, rather than duplicating conversion tracking, reads directly from the models that already create those events: `FormSubmission` (Phase 7) for leads and `Order` (Phase 3) for orders/revenue. Surfaced in a new "Analytics" tab (`AnalyticsPanel.tsx`) with summary cards, a plain-div daily-pageviews bar chart, a device-share breakdown, and top-pages/top-referrers tables.

**The scope decision (round 2 — Agency/White-Label):** picking this up, investigation found project ownership was checked with a direct `userId` match at roughly 90+ call sites across 6 route files (`builder.js` alone had ~75). For an agency team member to actually *use* a client's project — not just see it open before every panel (CMS, commerce, assets, forms, analytics) 404s — that check needed to become agency-aware at nearly all of them, not just where a project is first opened. Asked the user: a full mechanical retrofit via one shared helper, or a fast, low-risk gateway-only version that would leave the feature looking built but not really usable. Chose the full retrofit.

**What shipped (Agency/White-Label):** a new `Agency` model (owner, name, white-label branding: logo/color/support email) and two new fields — `User.agencyId`/`agencyRole` (`owner`/`team`/`client`), `BuilderProject.agencyId`. One shared helper, `backend/lib/projectAccess.js` (`resolveProject`, `listAccessibleProjects`), encapsulates the actual access rule: a project is reachable by its direct owner (`userId` match, completely unchanged from before this phase) **or** by any `owner`/`team` member of the agency it's tagged with — looked up fresh from the database on every request, never trusted from a JWT claim, so removing someone revokes their access immediately rather than after their token happens to expire. A `client` account gets no second access path at all — their own project already works exactly like any independent user's always has, via plain direct ownership, so nothing about the client case needed to change. Every one of the ~90 call sites across `builder.js`, `commerce.js`, `cms.js`, `assets.js`, `forms.js`, and `analytics.js` was swapped to call this shared helper, preserving each route's exact existing behavior otherwise (same error messages, same lean/select/mutate semantics) — verified by re-reading every route rather than trusting a mechanical find-and-replace alone. A project created by an agency owner/team member is auto-tagged with `agencyId`; `backend/routes/agency.js` adds agency creation, inviting an *existing* account as team-or-client (no email-invite pipeline — an honest, disclosed scope cut, not a silent gap), member removal, white-label settings, and reassigning a project's direct ownership to a specific client. A new "Agency" section in the client dashboard (`AgencyPanel.tsx`) covers all of it, and project cards in "My Websites" get an "Agency" badge when `agencyId` is set.

**A real bug caught while doing the retrofit, not assumed away:** `backend/routes/assets.js`'s delete route scoped deletion by both `projectId` *and* `userId: req.user.userId` — meaning even after the ownership check itself became agency-aware, a team member still couldn't delete an asset a teammate (or the client) had uploaded, since the delete query itself independently re-checked the specific uploader. Fixed by scoping the delete to `projectId` alone, which is already access-checked by the middleware in front of it.

**Deliberately not built:** no email-invite pipeline (inviting attaches an *existing* registered account directly, the way an admin action would — a real invite flow with its own signup link is a separate feature); owner and team share exactly equal permissions over every agency project (no finer-grained tiers, e.g. "team can edit but not delete"); removing a team member doesn't reassign or revoke access to projects *they personally created* under the agency (those keep their `agencyId` tag and the departing member's own direct `userId` ownership) — all disclosed, bounded scope cuts, not oversights.

**Verified end-to-end against the real dev database — not a mocked test:** created a real agency, invited a real second account as `team`, created a project as the owner (confirmed it auto-tagged with `agencyId`), then as the **team member** confirmed they could list it, open it, save a page edit, and reach CMS/assets/forms/analytics for it — all as real HTTP calls with a real JWT for that distinct account. Then, as a genuinely unrelated third account, confirmed every one of those same calls correctly returned 404/null instead of the project — the actual security property the whole retrofit exists for. Assigned the project to a client account and confirmed both the client (direct ownership) and the team member (agency membership) retained correct access afterward. Removed the team member and confirmed their access was revoked immediately on their still-valid, unexpired token (proving the fresh-lookup design, not a stale-JWT-claim shortcut). Removed the client and confirmed the project's `agencyId` was cleared while `userId` correctly stayed with them. All test users/agency/project cleaned up afterward, confirmed the untouched shared test project was unaffected throughout. `tsc --noEmit` clean, 125/125 tests passing, a full `rm -rf .next && npm run build` clean.

---

## 7 · Reading order for anyone new to this

1. `STRUCTURE.md` — how the codebase is organized
2. `STATUS.html` — what's actually verified done, partial, or missing, with file-level evidence
3. `BLUEPRINT.md` (this file) — what to build next, and in what order, and why
