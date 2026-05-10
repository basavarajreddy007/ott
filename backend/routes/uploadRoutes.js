const express = require('express');
const multer = require('multer');
const { Readable } = require('stream');
const { protect } = require('../middlewares/authMiddleware');
const cloudinary = require('../config/cloudinary');
const Video = require('../models/Video');

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 500 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('video/')) cb(null, true);
        else cb(new Error('Only video files are allowed'));
    }
});

router.post('/video', protect, (req, res, next) => {
    upload.single('video')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ success: false, error: `Upload error: ${err.message}` });
        }
        if (err) {
            return res.status(400).json({ success: false, error: err.message });
        }
        next();
    });
}, async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, error: 'No video file provided' });

        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { resource_type: 'video', folder: 'videos', type: 'upload', access_mode: 'public' },
                (error, result) => error ? reject(error) : resolve(result)
            );
            const readable = new Readable();
            readable.push(req.file.buffer);
            readable.push(null);
            readable.pipe(stream);
        });

        res.json({
            success: true,
            url: result.secure_url,
            publicId: result.public_id,
            duration: Math.round(result.duration || 0)
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/signed-url/:videoId', protect, async (req, res) => {
    try {
        const video = await Video.findById(req.params.videoId).lean();
        if (!video) return res.status(404).json({ success: false, error: 'Video not found' });
        res.json({ success: true, url: video.videoUrl });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
