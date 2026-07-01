const express = require("express");
const router = express.Router();
const { getMovies, getMovie, getMovieById, createMovie, updateMovie, deleteMovie, getFeaturedMovies, getTrendingMovies, getNewReleases, getTopRated, likeMovie, dislikeMovie, getMoviesByGenre, getSimilarMovies, getUserUploads, createUserMovie } = require("../controllers/movieController");
const { protect, adminOnly, optionalAuth } = require("../middleware/auth");

router.get("/", getMovies);
router.get("/featured", getFeaturedMovies);
router.get("/trending", getTrendingMovies);
router.get("/new-releases", getNewReleases);
router.get("/top-rated", getTopRated);
router.get("/genre/:genreId", getMoviesByGenre);
router.get("/user-uploads", getUserUploads);
router.get("/id/:id", getMovieById);
router.get("/:id/similar", getSimilarMovies);
router.get("/:slug", optionalAuth, getMovie);
router.post("/user-upload", protect, createUserMovie);
router.post("/", protect, adminOnly, createMovie);
router.put("/:id", protect, adminOnly, updateMovie);
router.delete("/:id", protect, adminOnly, deleteMovie);
router.post("/:id/like", protect, likeMovie);
router.post("/:id/dislike", protect, dislikeMovie);

module.exports = router;
