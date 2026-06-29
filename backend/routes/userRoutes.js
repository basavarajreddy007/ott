const express = require("express");
const router = express.Router();
const { updateProfile, changePassword, uploadAvatar, getWatchHistory, deleteAccount } = require("../controllers/userController");
const { protect } = require("../middleware/auth");
const { uploadAvatar: avatarUpload } = require("../middleware/uploadMiddleware");

router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);
router.post("/avatar", protect, avatarUpload.single("avatar"), uploadAvatar);
router.get("/watch-history", protect, getWatchHistory);
router.delete("/account", protect, deleteAccount);

module.exports = router;
