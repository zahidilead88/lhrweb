const express = require("express");
const router = express.Router();
const { auth, requireAdmin } = require("../middleware/auth");
const {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserWebsites,
  deleteUserWebsite,
  deleteUserWebsitePage,
} = require("../controllers/userController");

router.get("/", auth, requireAdmin, getUsers);
router.post("/", auth, requireAdmin, createUser);
router.put("/:id", auth, requireAdmin, updateUser);
router.delete("/:id", auth, requireAdmin, deleteUser);
router.get("/:id/websites", auth, requireAdmin, getUserWebsites);
router.delete("/:id/websites/:websiteId", auth, requireAdmin, deleteUserWebsite);
router.delete("/:id/websites/:websiteId/pages/:pageId", auth, requireAdmin, deleteUserWebsitePage);

module.exports = router;
