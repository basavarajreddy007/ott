const express = require("express");
const router = express.Router();
const { chat, scriptGenerate, scriptContinue, describe, recommend, moodRecommend, storyAnalyze, generateThumbnail } = require("../controllers/aiController");
const { protect, optionalAuth } = require("../middleware/auth");

router.post("/chat", protect, chat);
router.post("/script/generate", protect, scriptGenerate);
router.post("/script/continue", protect, scriptContinue);
router.post("/describe", protect, describe);
router.post("/recommend", protect, recommend);
router.post("/mood-recommend", optionalAuth, moodRecommend);
router.post("/analyze", protect, storyAnalyze);
router.post("/thumbnail/generate", protect, generateThumbnail);

module.exports = router;
