require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const Video = require('../models/Video');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
});

function getPublicId(url) {
    if (!url) return null;
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;
    return parts[1].replace(/^v\d+\//, '').replace(/\.[^/.]+$/, '');
}

function buildPublicUrl(cloudName, publicId, resourceType, version) {
    const vPart = version ? `v${version}/` : '';
    const ext = resourceType === 'video' ? 'mp4' : 'jpg';
    return `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${vPart}${publicId}.${ext}`;
}

async function makePublic(publicId, resourceType) {
    try {
        const result = await cloudinary.uploader.explicit(publicId, {
            resource_type: resourceType,
            type: 'upload',
            access_control: [{ access_type: 'anonymous' }]
        });
        return result;
    } catch {
        const result = await cloudinary.uploader.rename(
            publicId, publicId,
            { resource_type: resourceType, type: 'authenticated', to_type: 'upload', overwrite: true }
        );
        return result;
    }
}

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const videos = await Video.find({
        $or: [
            { videoUrl: /\/authenticated\// },
            { videoUrl: { $not: /\/upload\// } }
        ]
    });

    console.log(`Found ${videos.length} videos to check`);

    const allVideos = await Video.find({});
    let fixed = 0;
    let skipped = 0;

    for (const video of allVideos) {
        const videoPublicId = getPublicId(video.videoUrl);
        if (!videoPublicId) { skipped++; continue; }

        try {
            const info = await cloudinary.api.resource(videoPublicId, { resource_type: 'video' });

            if (info.type !== 'upload' || info.access_mode !== 'public') {
                console.log(`Fixing: ${videoPublicId}`);
                const result = await makePublic(videoPublicId, 'video');
                const newUrl = buildPublicUrl(
                    process.env.CLOUDINARY_NAME,
                    result.public_id,
                    'video',
                    result.version
                );
                video.videoUrl = newUrl;
                await video.save();
                console.log(`  ✓ Fixed video URL → ${newUrl}`);
                fixed++;
            } else {
                skipped++;
            }
        } catch (err) {
            console.error(`  ✗ Failed for ${videoPublicId}:`, err.message);
        }
    }

    console.log(`\nDone. Fixed: ${fixed}, Skipped: ${skipped}`);
    await mongoose.disconnect();
}

run().catch(err => {
    console.error('Fatal:', err.message);
    process.exit(1);
});
