const WatchHistory = require("../models/WatchHistory");
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

const getWatchHistory = async (req, res, next) => {
  try {
    const history = await WatchHistory.find({ user: req.user._id })
      .sort({ watchedAt: -1 })
      .limit(50);

    const populated = await populateContent(history);
    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

const updateWatchProgress = async (req, res, next) => {
  try {
    const { contentId, contentType, progress, completed, episodeId, seasonNumber, episodeNumber } = req.body;

    const filter = {
      user: req.user._id,
      contentId,
      contentType,
    };

    const update = {
      progress,
      completed: completed || false,
      watchedAt: new Date(),
      ...(episodeId && { episodeId }),
      ...(seasonNumber !== undefined && { seasonNumber }),
      ...(episodeNumber !== undefined && { episodeNumber }),
    };

    const history = await WatchHistory.findOneAndUpdate(filter, update, {
      upsert: true,
      new: true,
    });

    res.status(200).json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
};

const deleteWatchHistory = async (req, res, next) => {
  try {
    await WatchHistory.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Watch history entry deleted" });
  } catch (error) {
    next(error);
  }
};

const clearWatchHistory = async (req, res, next) => {
  try {
    await WatchHistory.deleteMany({ user: req.user._id });
    res.status(200).json({ success: true, message: "Watch history cleared" });
  } catch (error) {
    next(error);
  }
};

const getContinueWatching = async (req, res, next) => {
  try {
    const history = await WatchHistory.find({
      user: req.user._id,
      progress: { $gt: 0 },
      completed: false,
    })
      .sort({ watchedAt: -1 })
      .limit(20);

    const populated = await populateContent(history);
    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

module.exports = { getWatchHistory, updateWatchProgress, deleteWatchHistory, clearWatchHistory, getContinueWatching };
