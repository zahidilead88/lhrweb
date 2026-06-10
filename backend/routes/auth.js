const express  = require("express");
const router   = express.Router();
const crypto   = require("crypto");
const User     = require("../models/User");
const { hashPassword, comparePassword, signToken } = require("../lib/authUtils");
const validate = require("../middleware/validate");
const { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } = require("../schemas");
const { sendWelcomeEmail, sendPasswordResetEmail } = require("../lib/email");

// Register
router.post("/register", validate(registerSchema), async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const user = await User.create({
      name,
      email,
      password: await hashPassword(password),
      role: "user",
    });

    sendWelcomeEmail(user.email, user.name).catch(console.error);

    res.status(201).json({
      message: "User created",
      role: user.role,
      user: { name: user.name, email: user.email },
    });
  } catch (err) { next(err); }
});

// Login
router.post("/login", validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    if (user.role === "admin") {
      return res.status(403).json({ message: "Access denied. Admins must login from the admin panel." });
    }

    if (!await comparePassword(password, user.password)) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = signToken({ userId: user._id, role: user.role });

    res.json({
      token,
      role:        user.role,
      package:     user.package || null,
      permissions: user.permissions || [],
      user:        { name: user.name, email: user.email },
    });
  } catch (err) { next(err); }
});

// Forgot password
router.post("/forgot-password", validate(forgotPasswordSchema), async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    // Always return same response to prevent email enumeration
    if (!user) return res.json({ message: "If that email exists, a reset link was sent." });

    const rawToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken   = crypto.createHash("sha256").update(rawToken).digest("hex");
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const resetUrl = `${process.env.APP_URL || "http://localhost:3000"}/reset-password?token=${rawToken}`;
    sendPasswordResetEmail(user.email, resetUrl).catch(console.error);

    res.json({ message: "If that email exists, a reset link was sent." });
  } catch (err) { next(err); }
});

// Reset password
router.post("/reset-password", validate(resetPasswordSchema), async (req, res, next) => {
  try {
    const hashed = crypto.createHash("sha256").update(req.body.token).digest("hex");
    const user   = await User.findOne({
      passwordResetToken:   hashed,
      passwordResetExpires: { $gt: new Date() },
    });
    if (!user) return res.status(400).json({ message: "Invalid or expired reset token." });

    user.password            = await hashPassword(req.body.password);
    user.passwordResetToken  = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ message: "Password updated successfully." });
  } catch (err) { next(err); }
});

module.exports = router;
