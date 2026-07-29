const User = require("../../models/User");

// Ch 7.3 — monthly AI unit quotas per plan. Weights come from the prompt registry.
const PLAN_UNITS = {
  starter: 50,
  pro:     500,
};
const DEFAULT_UNITS = 5;       // no package (free)
const DAILY_ANOMALY_CAP = 200; // Ch 7.2 — per-user abuse ceiling regardless of plan

function currentPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function limitFor(user) {
  if (user.role === "admin") return Infinity;
  return PLAN_UNITS[user.package] ?? DEFAULT_UNITS;
}

function resetsAt() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString();
}

// Gate — check BEFORE the model call. Lazy monthly reset.
async function checkQuota(user, weight) {
  if (process.env.AI_QUOTA_DISABLED === "true") return { ok: true };
  const limit = limitFor(user);
  if (limit === Infinity) return { ok: true };

  const period = currentPeriod();
  const usage = user.aiUsage && user.aiUsage.period === period ? user.aiUsage : { period, unitsUsed: 0 };

  if (usage.unitsUsed + weight > limit) {
    return { ok: false, unitsUsed: usage.unitsUsed, limit, resetsAt: resetsAt() };
  }
  return { ok: true };
}

// Decrement — AFTER successful validation only (principle A6). Atomic $inc with period guard.
async function decrementQuota(userId, weight) {
  if (process.env.AI_QUOTA_DISABLED === "true") return;
  const period = currentPeriod();
  const res = await User.updateOne(
    { _id: userId, "aiUsage.period": period },
    { $inc: { "aiUsage.unitsUsed": weight } }
  );
  if (res.matchedCount === 0) {
    // new period (or first ever use) — reset; never below zero (refunds)
    await User.updateOne(
      { _id: userId },
      { $set: { aiUsage: { period, unitsUsed: Math.max(0, weight) } } }
    );
  }
}

module.exports = { checkQuota, decrementQuota, PLAN_UNITS, currentPeriod };
