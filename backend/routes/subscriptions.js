const express       = require("express");
const router        = express.Router();
const stripe        = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { auth }      = require("../middleware/auth");
const User          = require("../models/User");
const Subscription  = require("../models/Subscription");
const WebhookEvent  = require("../models/WebhookEvent");
const { sendPaymentConfirmation, sendCancelledEmail } = require("../lib/email");

const PLANS = {
  starter: process.env.STRIPE_PRICE_STARTER,
  pro:     process.env.STRIPE_PRICE_PRO,
};

// ── Webhook handler (called with raw body from app.js BEFORE express.json) ───
async function webhookHandler(req, res) {
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ message: `Webhook error: ${err.message}` });
  }

  try {
    // Idempotency guard — Stripe can deliver the same event more than once
    try {
      await WebhookEvent.create({ stripeEventId: event.id, type: event.type });
    } catch (dupErr) {
      if (dupErr.code === 11000) {
        console.log(`Duplicate webhook event skipped: ${event.id}`);
        return res.json({ received: true });
      }
      throw dupErr;
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId  = session.metadata?.userId;
      const plan    = session.metadata?.plan;
      const subId   = session.subscription;

      if (userId && plan && subId) {
        const stripeSub = await stripe.subscriptions.retrieve(subId);

        await Subscription.findOneAndUpdate(
          { userId },
          {
            userId,
            stripeCustomerId:     session.customer,
            stripeSubscriptionId: subId,
            plan,
            status:               "active",
            currentPeriodStart:   new Date(stripeSub.current_period_start * 1000),
            currentPeriodEnd:     new Date(stripeSub.current_period_end   * 1000),
            cancelAtPeriodEnd:    false,
          },
          { upsert: true, new: true }
        );

        const updatedUser = await User.findByIdAndUpdate(userId, {
          role:             "builder",
          package:          plan,
          stripeCustomerId: session.customer,
        }, { new: true });

        if (updatedUser) {
          sendPaymentConfirmation(updatedUser.email, plan).catch(console.error);
        }

        console.log(`Subscription activated: user ${userId} → ${plan}`);
      }
    }

    if (event.type === "customer.subscription.updated") {
      const stripeSub = event.data.object;
      await Subscription.findOneAndUpdate(
        { stripeSubscriptionId: stripeSub.id },
        {
          status:             stripeSub.status,
          currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
          currentPeriodEnd:   new Date(stripeSub.current_period_end   * 1000),
          cancelAtPeriodEnd:  stripeSub.cancel_at_period_end,
        }
      );
    }

    if (event.type === "customer.subscription.deleted") {
      const stripeSub = event.data.object;
      const sub = await Subscription.findOneAndUpdate(
        { stripeSubscriptionId: stripeSub.id },
        { status: "cancelled" }
      );
      if (sub) {
        const cancelledUser = await User.findByIdAndUpdate(sub.userId, { role: "user", $unset: { package: "" } }, { new: true });
        if (cancelledUser) sendCancelledEmail(cancelledUser.email).catch(console.error);
        console.log(`Subscription cancelled: user ${sub.userId}`);
      }
    }
  } catch (err) {
    console.error("Webhook processing error:", err);
  }

  res.json({ received: true });
}

// ── POST /api/subscriptions/checkout ─────────────────────────────────────────
router.post("/checkout", auth, async (req, res) => {
  try {
    const { plan } = req.body;
    if (!PLANS[plan]) return res.status(400).json({ message: "Invalid plan. Choose starter or pro." });

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, name: user.name });
      customerId = customer.id;
      await User.findByIdAndUpdate(user._id, { stripeCustomerId: customerId });
    }

    const session = await stripe.checkout.sessions.create({
      customer:             customerId,
      payment_method_types: ["card"],
      line_items:           [{ price: PLANS[plan], quantity: 1 }],
      mode:                 "subscription",
      success_url:          `${process.env.APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:           `${process.env.APP_URL}/pricing`,
      metadata:             { userId: user._id.toString(), plan },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    res.status(500).json({ message: "Failed to create checkout session" });
  }
});

// ── POST /api/subscriptions/portal ───────────────────────────────────────────
router.post("/portal", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user?.stripeCustomerId) return res.status(400).json({ message: "No billing account found" });

    const session = await stripe.billingPortal.sessions.create({
      customer:   user.stripeCustomerId,
      return_url: `${process.env.APP_URL}/dashboard`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Portal error:", err);
    res.status(500).json({ message: "Failed to open billing portal" });
  }
});

// ── GET /api/subscriptions/status ────────────────────────────────────────────
router.get("/status", auth, async (req, res) => {
  try {
    const sub = await Subscription.findOne({ userId: req.user.userId });
    res.json(sub || null);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = { router, webhookHandler };
