const fs = require("fs");
const { uploadToCloudinary } = require("../services/cloudinaryService");

const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const result = await uploadToCloudinary(req.file, "ott-platform/images");
    fs.unlink(req.file.path, () => {});

    res.status(200).json({
      success: true,
      message: "Image uploaded",
      data: { url: result.url, publicId: result.publicId },
    });
  } catch (error) {
    if (req.file) fs.unlink(req.file.path, () => {});
    next(error);
  }
};

const uploadVideo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const result = await uploadToCloudinary(req.file, "ott-platform/videos");
    fs.unlink(req.file.path, () => {});

    res.status(200).json({
      success: true,
      message: "Video uploaded",
      data: { url: result.url, publicId: result.publicId, duration: result.duration },
    });
  } catch (error) {
    if (req.file) fs.unlink(req.file.path, () => {});
    next(error);
  }
};

const uploadPoster = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const result = await uploadToCloudinary(req.file, "ott-platform/posters");
    fs.unlink(req.file.path, () => {});

    res.status(200).json({
      success: true,
      message: "Poster uploaded",
      data: { url: result.url, publicId: result.publicId },
    });
  } catch (error) {
    if (req.file) fs.unlink(req.file.path, () => {});
    next(error);
  }
};

const uploadBanner = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const result = await uploadToCloudinary(req.file, "ott-platform/banners");
    fs.unlink(req.file.path, () => {});

    res.status(200).json({
      success: true,
      message: "Banner uploaded",
      data: { url: result.url, publicId: result.publicId },
    });
  } catch (error) {
    if (req.file) fs.unlink(req.file.path, () => {});
    next(error);
  }
};

module.exports = { uploadImage, uploadVideo, uploadPoster, uploadBanner };
