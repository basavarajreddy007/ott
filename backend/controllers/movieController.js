const Movie = require("../models/Movie");
const createSlug = require("../utils/slugify");

const getMovies = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, genre, language, year, rating, sort, search, category } = req.query;
    const query = { isActive: true };

    if (genre) query.genres = genre;
    if (language) query.language = language;
    if (year) query.releaseYear = parseInt(year);
    if (rating) query.imdbRating = { $gte: parseFloat(rating) };
    if (category) query.category = category;
    if (search) {
      query.$text = { $search: search };
    }

    let sortOption = { createdAt: -1 };
    if (sort === "rating") sortOption = { imdbRating: -1 };
    if (sort === "year") sortOption = { releaseYear: -1 };
    if (sort === "views") sortOption = { views: -1 };
    if (sort === "title") sortOption = { title: 1 };

    const movies = await Movie.find(query)
      .populate("genres", "name slug")
      .populate("category", "name slug")
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Movie.countDocuments(query);

    res.status(200).json({
      success: true,
      data: movies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findOne({ slug: req.params.slug })
      .populate("genres", "name slug")
      .populate("category", "name slug");

    if (!movie) {
      return res.status(404).json({ success: false, message: "Movie not found" });
    }

    movie.views += 1;
    await movie.save();

    res.status(200).json({ success: true, data: movie });
  } catch (error) {
    next(error);
  }
};

const getMovieById = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id)
      .populate("genres", "name slug")
      .populate("category", "name slug");

    if (!movie) {
      return res.status(404).json({ success: false, message: "Movie not found" });
    }

    res.status(200).json({ success: true, data: movie });
  } catch (error) {
    next(error);
  }
};

const createMovie = async (req, res, next) => {
  try {
    const movieData = req.body;
    movieData.slug = createSlug(movieData.title);

    const movie = await Movie.create(movieData);

    res.status(201).json({ success: true, message: "Movie created", data: movie });
  } catch (error) {
    next(error);
  }
};

const updateMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!movie) {
      return res.status(404).json({ success: false, message: "Movie not found" });
    }

    res.status(200).json({ success: true, message: "Movie updated", data: movie });
  } catch (error) {
    next(error);
  }
};

const deleteMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);
    if (!movie) {
      return res.status(404).json({ success: false, message: "Movie not found" });
    }
    res.status(200).json({ success: true, message: "Movie deleted" });
  } catch (error) {
    next(error);
  }
};

const getFeaturedMovies = async (req, res, next) => {
  try {
    const movies = await Movie.find({ isActive: true, isFeatured: true })
      .populate("genres", "name slug")
      .sort({ createdAt: -1 })
      .limit(10);
    res.status(200).json({ success: true, data: movies });
  } catch (error) {
    next(error);
  }
};

const getTrendingMovies = async (req, res, next) => {
  try {
    const movies = await Movie.find({ isActive: true })
      .populate("genres", "name slug")
      .sort({ views: -1 })
      .limit(20);
    res.status(200).json({ success: true, data: movies });
  } catch (error) {
    next(error);
  }
};

const getNewReleases = async (req, res, next) => {
  try {
    const movies = await Movie.find({ isActive: true })
      .populate("genres", "name slug")
      .sort({ releaseYear: -1, createdAt: -1 })
      .limit(20);
    res.status(200).json({ success: true, data: movies });
  } catch (error) {
    next(error);
  }
};

const getTopRated = async (req, res, next) => {
  try {
    const movies = await Movie.find({ isActive: true, imdbRating: { $gte: 7 } })
      .populate("genres", "name slug")
      .sort({ imdbRating: -1 })
      .limit(20);
    res.status(200).json({ success: true, data: movies });
  } catch (error) {
    next(error);
  }
};

const likeMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ success: false, message: "Movie not found" });
    }

    const userId = req.user._id;
    const alreadyLiked = movie.likes.includes(userId);

    if (alreadyLiked) {
      movie.likes.pull(userId);
    } else {
      movie.likes.push(userId);
      movie.dislikes.pull(userId);
    }

    await movie.save();
    res.status(200).json({ success: true, data: { likes: movie.likes.length, dislikes: movie.dislikes.length } });
  } catch (error) {
    next(error);
  }
};

const dislikeMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ success: false, message: "Movie not found" });
    }

    const userId = req.user._id;
    const alreadyDisliked = movie.dislikes.includes(userId);

    if (alreadyDisliked) {
      movie.dislikes.pull(userId);
    } else {
      movie.dislikes.push(userId);
      movie.likes.pull(userId);
    }

    await movie.save();
    res.status(200).json({ success: true, data: { likes: movie.likes.length, dislikes: movie.dislikes.length } });
  } catch (error) {
    next(error);
  }
};

const getMoviesByGenre = async (req, res, next) => {
  try {
    const movies = await Movie.find({ isActive: true, genres: req.params.genreId })
      .populate("genres", "name slug")
      .sort({ createdAt: -1 })
      .limit(20);
    res.status(200).json({ success: true, data: movies });
  } catch (error) {
    next(error);
  }
};

const getSimilarMovies = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ success: false, message: "Movie not found" });
    }

    const similar = await Movie.find({
      _id: { $ne: movie._id },
      isActive: true,
      $or: [
        { genres: { $in: movie.genres } },
        { language: movie.language },
        { category: movie.category },
      ],
    })
      .populate("genres", "name slug")
      .limit(10);

    res.status(200).json({ success: true, data: similar });
  } catch (error) {
    next(error);
  }
};

const getUserUploads = async (req, res, next) => {
  try {
    const movies = await Movie.find({ uploadedBy: { $exists: true }, isActive: true })
      .populate("uploadedBy", "name avatar")
      .sort({ createdAt: -1 })
      .limit(20);
    res.status(200).json({ success: true, data: movies });
  } catch (error) {
    next(error);
  }
};

const createUserMovie = async (req, res, next) => {
  try {
    const { title, description, video, poster, requiredPlan } = req.body;
    if (!title || !video?.url) {
      return res.status(400).json({ success: false, message: "Title and video URL are required" });
    }

    const slug = createSlug(title) + "-" + Date.now();

    const movie = await Movie.create({
      title,
      description: description || "No description",
      slug,
      releaseYear: new Date().getFullYear(),
      duration: video.duration || 0,
      language: "English",
      video,
      poster: poster?.url ? poster : { url: "", publicId: "" },
      requiredPlan: requiredPlan || null,
      uploadedBy: req.user._id,
      isFeatured: true,
      isActive: true,
    });

    res.status(201).json({ success: true, message: "Movie published!", data: movie });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMovies,
  getMovie,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
  getFeaturedMovies,
  getTrendingMovies,
  getNewReleases,
  getTopRated,
  likeMovie,
  dislikeMovie,
  getMoviesByGenre,
  getSimilarMovies,
  getUserUploads,
  createUserMovie,
};
