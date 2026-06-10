const bcrypt = require("bcryptjs");
const User = require("../models/User");
const BuilderProject = require("../models/BuilderProject");

exports.getUsers = async (req, res) => {
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  res.json(users);
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, permissions, package: pkg } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already in use" });

    const hashed = await bcrypt.hash(password, 10);
    const userData = {
      name,
      email,
      password: hashed,
      role: role || "user",
      permissions: role === "builder" ? [] : (permissions || []),
    };
    if (role === "builder" && pkg) userData.package = pkg;

    const user = await User.create(userData);
    const { password: _, ...safe } = user.toObject();
    res.status(201).json(safe);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { name, email, password, role, permissions, package: pkg } = req.body;
    const update = {
      name,
      email,
      role,
      permissions: role === "builder" ? [] : (permissions || []),
    };
    if (role === "builder" && pkg) update.package = pkg;
    if (role !== "builder") update.package = undefined;
    if (password) update.password = await bcrypt.hash(password, 10);
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUserWebsites = async (req, res) => {
  try {
    const projects = await BuilderProject.find({ userId: req.params.id }).sort({ updatedAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteUserWebsite = async (req, res) => {
  try {
    const result = await BuilderProject.deleteOne({ _id: req.params.websiteId, userId: req.params.id });
    if (result.deletedCount === 0) return res.status(404).json({ message: "Website not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteUserWebsitePage = async (req, res) => {
  try {
    const project = await BuilderProject.findOne({ _id: req.params.websiteId, userId: req.params.id });
    if (!project) return res.status(404).json({ message: "Website not found" });
    project.pages = project.pages.filter((p) => p.id !== req.params.pageId);
    await project.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
