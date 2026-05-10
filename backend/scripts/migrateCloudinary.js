/**
 * Re-uploads all videos from old Cloudinary account to new one via direct URL streaming.
 * If the old URLs are 401, you must first log into dqptel7zy dashboard and set videos to public,
 * OR provide the correct OLD_CLOUDINARY_KEY / OLD_CLOUDINARY_SECRET in .env.
 *
 * Usage: node backend/scripts/migrateCloudinary.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const https = require('https');
const http = require('http');
const Video = require('../models/Video');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
});

console.log('Target Cloudinary account:', process.env.CLOUDINARY_NAME);

function fetchStream(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        const req = client.get(url, (res) => {
            if (res.statusCode === 401) return reject(new Error(`401 Unauthorized — old account credentials invalid or videos are private`));
            if (res.statusCode === 404) return reject(new Error(`404 Not Found`));
            if (res.statusCode >= 400) return reject(new Error(`HTTP ${res.statusCode}`));
            resolve(res);
        });
        req.on('error', reject);
    });
}

function reupload(stream, folder) {
    return new Promise((resolve, reject) => {
        const up = cloudinary.uploader.upload_stream(
            { resource_type: 'video', folder, type: 'upload', access_mode: 'public' },
            (err, result) => err ? reject(err) : resolve(result)
        );
        stream.pipe(up);
    });
}

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const videos = await Video.find({ videoUrl: /dqptel7zy/ });
    console.log(`Found ${videos.length} videos on old account\n`);

    let migrated = 0, failed = 0;

    for (const video of videos) {
        process.stdout.write(`"${video.title}" ... `);
        try {
            const stream = await fetchStream(video.videoUrl);
            const folder = video.videoUrl.includes('/neostream/') ? 'neostream' : 'videos';
            const result = await reupload(stream, folder);
            video.videoUrl = result.secure_url;
            await video.save();
            console.log(`✓ ${result.secure_url}`);
            migrated++;
        } catch (err) {
            console.log(`✗ ${err.message}`);
            failed++;
        }
    }

    console.log(`\nMigrated: ${migrated}  Failed: ${failed}`);
    await mongoose.disconnect();
}

run().catch(err => {
    console.error('Fatal:', err.message);
    process.exit(1);
});
