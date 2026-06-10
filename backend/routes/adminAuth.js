const express  = require("express");
const router   = express.Router();
const User     = require("../models/User");
const { hashPassword, comparePassword, signToken } = require("../lib/authUtils");
const validate = require("../middleware/validate");
const { registerSchema, loginSchema }              = require("../schemas");

// Register
router.post("/register", validate(registerSchema), async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "User already exists" });

    const user = await User.create({
      name,
      email,
      password: await hashPassword(password),
      role:        "admin",
      permissions: [],
    });

    res.status(201).json({
      message: "Admin user created",
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

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Only administrators can access the admin panel." });
    }

    if (!await comparePassword(password, user.password)) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = signToken({ userId: user._id, role: user.role });

    res.json({
      token,
      role:        user.role,
      permissions: user.permissions || [],
      package:     user.package || null,
      user:        { name: user.name, email: user.email },
    });
  } catch (err) { next(err); }
});

module.exports = router;
