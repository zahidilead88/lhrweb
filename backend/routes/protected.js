const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

// Example protected route
router.get("/admin", auth, async (req, res) => {
  res.json({ message: "Access granted", userId: req.user.userId });
});

module.exports = router;
