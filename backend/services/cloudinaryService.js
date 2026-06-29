const cloudinary = require("../config/cloudinary");

const uploadToCloudinary = async (file, folder = "ott-platform") => {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder,
      resource_type: "auto",
    });
    return {
      url: result.secure_url,
      publicId: result.public_id,
      duration: result.duration || null,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("File upload failed");
  }
};

const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return false;
  }
};

module.exports = { uploadToCloudinary, deleteFromCloudinary };
