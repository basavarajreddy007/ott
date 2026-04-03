const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
});

const uploadFromBuffer = (buffer, folder = 'videos', resource_type = 'auto') => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder, resource_type, chunk_size: 6000000 },
            (error, result) => {
                if (result) resolve(result);
                else reject(error);
            }
        );
        streamifier.createReadStream(buffer).pipe(uploadStream);
    });
};

const getPublicId = (url) => {
    try {
        const parts = url.split('/upload/');
        if (parts.length < 2) return null;
        const afterUpload = parts[1].replace(/^v\d+\//, '');
        return afterUpload.replace(/\.[^/.]+$/, '');
    } catch {
        return null;
    }
};

const deleteFromCloudinary = async (url, resource_type = 'image') => {
    if (!url) return;

    const publicId = getPublicId(url);
    if (!publicId) return;

    try {
        await cloudinary.uploader.destroy(publicId, { resource_type });
    } catch (err) {
        console.error(`Cloudinary delete failed for ${publicId}:`, err.message);
    }
};

module.exports = { cloudinary, uploadFromBuffer, deleteFromCloudinary };
