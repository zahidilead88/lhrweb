const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const AdminUser = require("../models/AdminUser");

const JWT_SECRET = process.env.JWT_SECRET;

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await AdminUser.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await AdminUser.create({
      name,
      email,
      password: hashedPassword,
    });
    res.status(201).json({
      message: "Admin User created",
      user: { name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await AdminUser.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ token, user: { name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
