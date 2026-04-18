const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
});

const uploadFromBuffer = (buffer, folder = 'videos', resource_type = 'auto') =>
    new Promise((resolve, reject) => {
        streamifier.createReadStream(buffer).pipe(
            cloudinary.uploader.upload_stream(
                { folder, resource_type, chunk_size: 6000000 },
                (err, result) => result ? resolve(result) : reject(err)
            )
        );
    });

const getPublicId = (url) => {
    const parts = url?.split('/upload/');
    if (!parts || parts.length < 2) return null;
    return parts[1].replace(/^v\d+\//, '').replace(/\.[^/.]+$/, '');
};

const deleteFromCloudinary = async (url, resource_type = 'image') => {
    const publicId = getPublicId(url);
    if (!publicId) return;
    try {
        await cloudinary.uploader.destroy(publicId, { resource_type });
    } catch (err) {
        console.error(`Cloudinary delete failed for ${publicId}:`, err.message);
    }
};

module.exports = { cloudinary, uploadFromBuffer, deleteFromCloudinary };
