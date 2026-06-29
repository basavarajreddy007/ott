const express = require("express");
const router = express.Router();
const { uploadImage, uploadVideo, uploadPoster, uploadBanner } = require("../controllers/uploadController");
const { protect } = require("../middleware/auth");
const { uploadImage: imageUpload, uploadVideo: videoUpload } = require("../middleware/uploadMiddleware");

router.post("/image", protect, imageUpload.single("file"), uploadImage);
router.post("/video", protect, videoUpload.single("file"), uploadVideo);
router.post("/poster", protect, imageUpload.single("file"), uploadPoster);
router.post("/banner", protect, imageUpload.single("file"), uploadBanner);

module.exports = router;
