const express        = require("express");
const router         = express.Router();
const crypto         = require("crypto");
const stripe         = require("stripe")(process.env.STRIPE_SECRET_KEY);
const BuilderProject = require("../models/BuilderProject");
const Product        = require("../models/Product");
const Collection      = require("../models/Collection");
const Cart            = require("../models/Cart");
const Order           = require("../models/Order");
const WebhookEvent    = require("../models/WebhookEvent");
const { auth }        = require("../middleware/auth");
const { resolveProject } = require("../lib/projectAccess");

// Round 5 doc, Part 6 — catalog CRUD (products, collections). Phase 3
// (docs/LHRWEB_MASTER_IMPLEMENTATION_PLAN.md §9) adds: a public read route for
// storefront rendering, Stripe Connect onboarding (one connected account per
// project — payouts go directly to the site owner, platform takes a fee via
// destination charges), a public cartToken-keyed cart, and checkout. Orders
// are created ONLY by `webhookHandler` below, never by the checkout route
// itself — Stripe's webhook is the source of truth for "payment succeeded."

const PLATFORM_FEE_BPS = 500; // 5% — application fee on destination charges. Tune here.
const CART_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function toSlug(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }

// Confirms the requesting user can access the project a product/collection belongs
// to — either as its direct owner, or (Phase 8) as an owner/team member of the
// agency it's tagged with. See backend/lib/projectAccess.js.
async function assertOwnsProject(projectId, userId) {
  return resolveProject(userId, projectId, { select: "_id ecommerceEnabled", lean: true });
}

// ── Public (storefront rendering — no auth, same trust level as the site itself) ──
router.get("/public/:projectId", async (req, res) => {
  try {
    const [products, collections] = await Promise.all([
      Product.find({ projectId: req.params.projectId, status: "active" }).select("-cost").lean(),
      Collection.find({ projectId: req.params.projectId }).lean(),
    ]);
    res.json({ products, collections });
  } catch (err) {
    console.error("commerce public fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ── Products ───────────────────────────────────────────────────────────────

router.get("/products", auth, async (req, res) => {
  try {
    const { projectId } = req.query;
    if (!projectId) return res.status(400).json({ message: "projectId is required" });
    if (!(await assertOwnsProject(projectId, req.user.userId))) return res.status(404).json({ message: "Project not found" });
    const products = await Product.find({ projectId }).sort({ createdAt: -1 }).lean();
    res.json(products);
  } catch (err) {
    console.error("commerce products list error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/products", auth, async (req, res) => {
  try {
    const { projectId, name, price } = req.body;
    if (!projectId || !name || price == null) return res.status(400).json({ message: "projectId, name and price are required" });
    if (Number(price) < 0) return res.status(400).json({ message: "price must be non-negative" });
    if (!(await assertOwnsProject(projectId, req.user.userId))) return res.status(404).json({ message: "Project not found" });

    let slug = toSlug(name), i = 1;
    while (await Product.findOne({ projectId, slug }).select("_id").lean()) slug = `${toSlug(name)}-${i++}`;

    const product = await Product.create({
      projectId, name: String(name).slice(0, 200), slug,
      price: Number(price),
      description: String(req.body.description || "").slice(0, 20000),
      images: Array.isArray(req.body.images) ? req.body.images.slice(0, 20) : [],
      status: ["active", "draft", "archived"].includes(req.body.status) ? req.body.status : "draft",
    });
    res.status(201).json(product);
  } catch (err) {
    console.error("commerce product create error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/products/:id", auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (!(await assertOwnsProject(product.projectId, req.user.userId))) return res.status(403).json({ message: "Forbidden" });

    const editable = ["name", "description", "status", "images", "price", "compareAtPrice", "cost", "options", "variants", "inventory", "shipping", "collections", "tags", "vendor", "seo"];
    for (const key of editable) {
      if (req.body[key] !== undefined) product[key] = req.body[key];
    }
    if (product.price < 0) return res.status(400).json({ message: "price must be non-negative" });
    await product.save();
    res.json(product);
  } catch (err) {
    console.error("commerce product update error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/products/:id", auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).select("projectId").lean();
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (!(await assertOwnsProject(product.projectId, req.user.userId))) return res.status(403).json({ message: "Forbidden" });
    await Product.deleteOne({ _id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    console.error("commerce product delete error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ── Collections ────────────────────────────────────────────────────────────

router.get("/collections", auth, async (req, res) => {
  try {
    const { projectId } = req.query;
    if (!projectId) return res.status(400).json({ message: "projectId is required" });
    if (!(await assertOwnsProject(projectId, req.user.userId))) return res.status(404).json({ message: "Project not found" });
    const collections = await Collection.find({ projectId }).sort({ createdAt: -1 }).lean();
    res.json(collections);
  } catch (err) {
    console.error("commerce collections list error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/collections", auth, async (req, res) => {
  try {
    const { projectId, name } = req.body;
    if (!projectId || !name) return res.status(400).json({ message: "projectId and name are required" });
    if (!(await assertOwnsProject(projectId, req.user.userId))) return res.status(404).json({ message: "Project not found" });

    let slug = toSlug(name), i = 1;
    while (await Collection.findOne({ projectId, slug }).select("_id").lean()) slug = `${toSlug(name)}-${i++}`;

    const collection = await Collection.create({
      projectId, name: String(name).slice(0, 120), slug,
      type: req.body.type === "automatic" ? "automatic" : "manual",
      rules: req.body.type === "automatic" && Array.isArray(req.body.rules) ? req.body.rules.slice(0, 10) : [],
      productIds: Array.isArray(req.body.productIds) ? req.body.productIds.slice(0, 500) : [],
    });
    res.status(201).json(collection);
  } catch (err) {
    console.error("commerce collection create error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/collections/:id", auth, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id).select("projectId").lean();
    if (!collection) return res.status(404).json({ message: "Collection not found" });
    if (!(await assertOwnsProject(collection.projectId, req.user.userId))) return res.status(403).json({ message: "Forbidden" });
    await Collection.deleteOne({ _id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    console.error("commerce collection delete error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ── Stripe Connect — one connected account per project ──────────────────────

router.post("/connect/:projectId/onboard", auth, async (req, res) => {
  try {
    const { refreshUrl, returnUrl } = req.body;
    if (!refreshUrl || !returnUrl) return res.status(400).json({ message: "refreshUrl and returnUrl are required" });
    const project = await resolveProject(req.user.userId, req.params.projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (!project.stripeConnectAccountId) {
      const account = await stripe.accounts.create({ type: "express" });
      project.stripeConnectAccountId = account.id;
      await project.save();
    }

    const accountLink = await stripe.accountLinks.create({
      account: project.stripeConnectAccountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });
    res.json({ url: accountLink.url });
  } catch (err) {
    console.error("stripe connect onboard error:", err);
    res.status(500).json({ message: "Failed to start Stripe onboarding" });
  }
});

router.get("/connect/:projectId/status", auth, async (req, res) => {
  try {
    const project = await resolveProject(req.user.userId, req.params.projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (!project.stripeConnectAccountId) {
      return res.json({ connected: false, onboarded: false, chargesEnabled: false });
    }

    const account = await stripe.accounts.retrieve(project.stripeConnectAccountId);
    project.stripeConnectOnboarded = !!account.details_submitted;
    project.stripeConnectChargesEnabled = !!account.charges_enabled;
    await project.save();

    res.json({
      connected: true,
      onboarded: project.stripeConnectOnboarded,
      chargesEnabled: project.stripeConnectChargesEnabled,
    });
  } catch (err) {
    console.error("stripe connect status error:", err);
    res.status(500).json({ message: "Failed to check Stripe status" });
  }
});

// ── Cart (public — identified by an opaque cartToken, no auth) ──────────────

router.post("/cart", async (req, res) => {
  try {
    const { projectId } = req.body;
    if (!projectId) return res.status(400).json({ message: "projectId is required" });
    const cart = await Cart.create({
      cartToken: crypto.randomBytes(16).toString("hex"),
      projectId,
      items: [],
      expiresAt: new Date(Date.now() + CART_TTL_MS),
    });
    res.status(201).json(cart);
  } catch (err) {
    console.error("cart create error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/cart/:cartToken", async (req, res) => {
  try {
    const cart = await Cart.findOne({ cartToken: req.params.cartToken }).lean();
    if (!cart) return res.status(404).json({ message: "Cart not found or expired" });
    res.json(cart);
  } catch (err) {
    console.error("cart fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/cart/:cartToken/items", async (req, res) => {
  try {
    const { productId, variantId, quantity } = req.body;
    const qty = Math.max(1, Math.floor(Number(quantity) || 1));
    if (!productId) return res.status(400).json({ message: "productId is required" });

    const cart = await Cart.findOne({ cartToken: req.params.cartToken });
    if (!cart) return res.status(404).json({ message: "Cart not found or expired" });

    const product = await Product.findOne({ _id: productId, projectId: cart.projectId, status: "active" }).lean();
    if (!product) return res.status(404).json({ message: "Product not found" });

    const variant = variantId ? product.variants?.find((v) => v.id === variantId) : null;
    if (variantId && !variant) return res.status(404).json({ message: "Variant not found" });
    const price = variant ? variant.price : product.price;

    const existing = cart.items.find((it) => String(it.productId) === String(productId) && (it.variantId || null) === (variantId || null));
    if (existing) {
      existing.quantity += qty;
    } else {
      cart.items.push({ productId, variantId: variantId || undefined, quantity: qty, priceSnapshot: price });
    }
    cart.expiresAt = new Date(Date.now() + CART_TTL_MS);
    await cart.save();
    res.json(cart);
  } catch (err) {
    console.error("cart add item error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// cartItemSchema is `{ _id: false }` (deliberately — see models/Cart.js) — a
// line is identified by its productId + optional variantId, the same key
// already used to merge on add.
function findLineIndex(cart, productId, variantId) {
  return cart.items.findIndex((it) => String(it.productId) === String(productId) && (it.variantId || null) === (variantId || null));
}

router.put("/cart/:cartToken/items/:productId", async (req, res) => {
  try {
    const { variantId } = req.query;
    const qty = Math.floor(Number(req.body.quantity));
    const cart = await Cart.findOne({ cartToken: req.params.cartToken });
    if (!cart) return res.status(404).json({ message: "Cart not found or expired" });

    const idx = findLineIndex(cart, req.params.productId, variantId);
    if (qty <= 0) {
      if (idx !== -1) cart.items.splice(idx, 1);
    } else {
      if (idx === -1) return res.status(404).json({ message: "Item not found" });
      cart.items[idx].quantity = qty;
    }
    await cart.save();
    res.json(cart);
  } catch (err) {
    console.error("cart update item error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/cart/:cartToken/items/:productId", async (req, res) => {
  try {
    const { variantId } = req.query;
    const cart = await Cart.findOne({ cartToken: req.params.cartToken });
    if (!cart) return res.status(404).json({ message: "Cart not found or expired" });
    const idx = findLineIndex(cart, req.params.productId, variantId);
    if (idx !== -1) cart.items.splice(idx, 1);
    await cart.save();
    res.json(cart);
  } catch (err) {
    console.error("cart remove item error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ── Checkout ──────────────────────────────────────────────────────────────

router.post("/checkout", async (req, res) => {
  try {
    const { cartToken, successUrl, cancelUrl, customerEmail } = req.body;
    if (!cartToken || !successUrl || !cancelUrl) {
      return res.status(400).json({ message: "cartToken, successUrl and cancelUrl are required" });
    }

    const cart = await Cart.findOne({ cartToken }).lean();
    if (!cart || cart.items.length === 0) return res.status(400).json({ message: "Cart is empty" });

    const project = await BuilderProject.findById(cart.projectId).lean();
    if (!project?.stripeConnectAccountId || !project.stripeConnectChargesEnabled) {
      return res.status(400).json({ message: "This store isn't set up to accept payments yet." });
    }

    const products = await Product.find({ _id: { $in: cart.items.map((it) => it.productId) } }).lean();
    const productById = new Map(products.map((p) => [String(p._id), p]));

    const line_items = cart.items.map((it) => {
      const product = productById.get(String(it.productId));
      const variant = it.variantId ? product?.variants?.find((v) => v.id === it.variantId) : null;
      const name = variant ? `${product?.name ?? "Product"} — ${variant.title}` : (product?.name ?? "Product");
      const image = product?.images?.[0]?.url;
      return {
        quantity: it.quantity,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(it.priceSnapshot * 100),
          product_data: { name, images: image ? [image] : undefined },
        },
      };
    });

    const subtotalCents = cart.items.reduce((sum, it) => sum + Math.round(it.priceSnapshot * 100) * it.quantity, 0);
    const applicationFeeAmount = Math.round((subtotalCents * PLATFORM_FEE_BPS) / 10000);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      customer_email: customerEmail || undefined,
      payment_intent_data: {
        application_fee_amount: applicationFeeAmount,
        transfer_data: { destination: project.stripeConnectAccountId },
      },
      metadata: { cartToken, projectId: String(project._id) },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("checkout create error:", err);
    res.status(500).json({ message: "Failed to start checkout" });
  }
});

// ── Order creation — deliberately only ever called from the webhook below,
// never from the checkout route itself. Exported standalone (no Express
// req/res) so it can be exercised directly against a synthetic Stripe
// session object without needing a live webhook delivery.
async function processCheckoutSessionCompleted(session) {
  const { cartToken, projectId } = session.metadata || {};
  if (!cartToken || !projectId) return { ok: false, reason: "missing metadata" };

  const cart = await Cart.findOne({ cartToken }).lean();
  if (!cart) return { ok: false, reason: "cart not found (already processed or expired)" };

  const products = await Product.find({ _id: { $in: cart.items.map((it) => it.productId) } }).lean();
  const productById = new Map(products.map((p) => [String(p._id), p]));

  const items = cart.items.map((it) => {
    const product = productById.get(String(it.productId));
    const variant = it.variantId ? product?.variants?.find((v) => v.id === it.variantId) : null;
    return {
      productId: it.productId,
      variantId: it.variantId,
      name: variant ? `${product?.name ?? "Product"} — ${variant.title}` : (product?.name ?? "Product"),
      price: it.priceSnapshot,
      quantity: it.quantity,
      image: product?.images?.[0]?.url,
    };
  });
  const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);

  let order;
  try {
    order = await Order.create({
      projectId,
      orderNumber: `ORD-${Date.now().toString(36).toUpperCase()}`,
      customer: {
        name: session.customer_details?.name || "Customer",
        email: session.customer_details?.email || "",
      },
      items,
      subtotal,
      shipping: 0,
      discount: 0,
      total: subtotal,
      status: "pending",
      stripePaymentIntentId: session.payment_intent,
    });
  } catch (err) {
    if (err.code === 11000) return { ok: true, reason: "already processed (duplicate stripePaymentIntentId)" };
    throw err;
  }

  for (const it of cart.items) {
    if (it.variantId) {
      await Product.updateOne({ _id: it.productId, "variants.id": it.variantId }, { $inc: { "variants.$.inventory": -it.quantity } });
    } else {
      await Product.updateOne({ _id: it.productId, "inventory.track": true }, { $inc: { "inventory.quantity": -it.quantity } });
    }
  }

  await Cart.deleteOne({ cartToken });
  return { ok: true, orderId: order._id };
}

async function processAccountUpdated(account) {
  await BuilderProject.updateOne(
    { stripeConnectAccountId: account.id },
    { stripeConnectOnboarded: !!account.details_submitted, stripeConnectChargesEnabled: !!account.charges_enabled }
  );
}

// ── Webhook — raw body, mounted directly on `app` before express.json() (see app.js) ──
async function webhookHandler(req, res) {
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers["stripe-signature"], process.env.STRIPE_CONNECT_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    await WebhookEvent.create({ stripeEventId: event.id, type: event.type });
  } catch (err) {
    if (err.code === 11000) return res.json({ received: true }); // already processed
    console.error("commerce webhook idempotency error:", err);
    return res.status(500).json({ received: false });
  }

  try {
    if (event.type === "checkout.session.completed") {
      await processCheckoutSessionCompleted(event.data.object);
    } else if (event.type === "account.updated") {
      await processAccountUpdated(event.data.object);
    }
  } catch (err) {
    console.error("commerce webhook handling error:", err);
    return res.status(500).json({ received: false });
  }

  res.json({ received: true });
}

module.exports = { router, webhookHandler, processCheckoutSessionCompleted, processAccountUpdated };
