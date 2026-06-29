const Favorite = require("../models/Favorite");

const getFavorites = async (req, res, next) => {
  try {
    const favorites = await Favorite.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: favorites });
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
