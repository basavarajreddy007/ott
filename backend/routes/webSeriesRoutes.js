const express = require("express");
const router = express.Router();
const { getWebSeries, createWebSeries, updateWebSeries, deleteWebSeries, addWebSeriesSeason, addWebSeriesEpisode } = require("../controllers/webSeriesController");
const { protect, adminOnly } = require("../middleware/auth");

router.get("/", getWebSeries);
router.get("/:slug", getWebSeries);
router.post("/", protect, adminOnly, createWebSeries);
router.put("/:id", protect, adminOnly, updateWebSeries);
router.delete("/:id", protect, adminOnly, deleteWebSeries);
router.post("/:id/seasons", protect, adminOnly, addWebSeriesSeason);
router.post("/:id/seasons/:seasonNumber/episodes", protect, adminOnly, addWebSeriesEpisode);

module.exports = router;
