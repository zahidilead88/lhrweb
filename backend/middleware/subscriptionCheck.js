const Subscription = require("../models/Subscription");

const subscriptionCheck = async (req, res, next) => {
  try {
    const sub = await Subscription.findOne({ userId: req.user.userId, status: "active" });
    if (!sub) return res.status(403).json({ message: "Active subscription required" });
    req.subscription = sub;
    next();
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = subscriptionCheck;
