const Favorite = require("../models/Favorite");
const Movie = require("../models/Movie");
const TvShow = require("../models/TvShow");
const WebSeries = require("../models/WebSeries");

const populateContent = async (items) => {
  return Promise.all(items.map(async (item) => {
    const obj = item.toObject();
    try {
      let content = null;
      if (obj.contentType === "Movie") content = await Movie.findById(obj.contentId).select("title slug poster genres imdbRating releaseYear duration quality language").lean();
      else if (obj.contentType === "TvShow") content = await TvShow.findById(obj.contentId).select("title slug poster genres imdbRating releaseYear quality language").lean();
      else if (obj.contentType === "WebSeries") content = await WebSeries.findById(obj.contentId).select("title slug poster genres imdbRating releaseYear quality language").lean();
      obj.content = content;
    } catch { obj.content = null; }
    return obj;
  }));
};

const getFavorites = async (req, res, next) => {
  try {
    const favorites = await Favorite.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    const populated = await populateContent(favorites);
    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

const addFavorite = async (req, res, next) => {
  try {
    const { contentId, contentType } = req.body;

    const existing = await Favorite.findOne({
      user: req.user._id,
      contentId,
      contentType,
    });

    if (existing) {
      return res.status(400).json({ success: false, message: "Already in favorites" });
    }

    const favorite = await Favorite.create({
      user: req.user._id,
      contentId,
      contentType,
    });

    res.status(201).json({ success: true, message: "Added to favorites", data: favorite });
  } catch (error) {
    next(error);
  }
};

const removeFavorite = async (req, res, next) => {
  try {
    const favorite = await Favorite.findOneAndDelete({
      user: req.user._id,
      contentId: req.params.contentId,
      contentType: req.params.contentType,
    });

    if (!favorite) {
      return res.status(404).json({ success: false, message: "Favorite not found" });
    }

    res.status(200).json({ success: true, message: "Removed from favorites" });
  } catch (error) {
    next(error);
  }
};

const checkFavorite = async (req, res, next) => {
  try {
    const favorite = await Favorite.findOne({
      user: req.user._id,
      contentId: req.params.contentId,
      contentType: req.params.contentType,
    });

    res.status(200).json({ success: true, data: { isFavorite: !!favorite } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getFavorites, addFavorite, removeFavorite, checkFavorite };
