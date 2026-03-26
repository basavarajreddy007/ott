const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME || process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_KEY || process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET || process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folderName = 'ott_assets';
    let resourceType = 'auto';
    
    if (file.mimetype.includes('video')) {
      folderName = 'ott_videos';
      resourceType = 'video';
    } else if (file.mimetype.includes('image')) {
      folderName = 'ott_images';
      resourceType = 'image';
    }
    
    return {
      folder: folderName,
      resource_type: resourceType,
      allowed_formats: ['jpg', 'png', 'mp4', 'mkv', 'webp']
    };
  }
});

const upload = multer({ storage });

module.exports = {
  cloudinary,
  upload
};
