const Video = require('../models/Video');
const { uploadFromBuffer } = require('../utils/uploadCloudinary');

exports.searchVideos = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || !q.trim()) {
            return res.status(400).json({ success: false, error: 'Query parameter q is required' });
        }
        const regex = new RegExp(q.trim(), 'i');
        const videos = await Video.find({
            $or: [
                { title: regex },
                { description: regex },
                { genres: regex }
            ]
        }).sort('-createdAt').limit(50);

        res.status(200).json({ success: true, count: videos.length, data: videos });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

exports.getVideos = async (req, res) => {
    try {
        const reqQuery = { ...req.query };
        const removeFields = ['select', 'sort', 'page', 'limit'];
        removeFields.forEach(param => delete reqQuery[param]);

        let queryStr = JSON.stringify(reqQuery);
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

        let query = Video.find(JSON.parse(queryStr));

        if (req.query.select) {
            query = query.select(req.query.select.split(',').join(' '));
        }

        if (req.query.sort) {
            query = query.sort(req.query.sort.split(',').join(' '));
        } else {
            query = query.sort('-createdAt');
        }

        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const total = await Video.countDocuments(JSON.parse(queryStr));

        query = query.skip(startIndex).limit(limit);

        const videos = await query;
        const pagination = {};

        if (endIndex < total) pagination.next = { page: page + 1, limit };
        if (startIndex > 0) pagination.prev = { page: page - 1, limit };

        res.status(200).json({ success: true, count: videos.length, pagination, data: videos });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

exports.getVideo = async (req, res) => {
    try {
        const video = await Video.findByIdAndUpdate(
            req.params.id,
            { $inc: { views: 1 } },
            { new: true, runValidators: false }
        );

        if (!video) {
            return res.status(404).json({ success: false, error: 'Video not found' });
        }

        res.status(200).json({ success: true, data: video });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

exports.createVideo = async (req, res) => {
    try {
        let { title, description, videoUrl, thumbnailUrl, duration, genres, releaseYear, type } = req.body;

        if (req.files?.video?.[0]) {
            const result = await uploadFromBuffer(req.files.video[0].buffer, 'videos', 'video');
            videoUrl = result.secure_url;
        }

        if (req.files?.thumbnail?.[0]) {
            const result = await uploadFromBuffer(req.files.thumbnail[0].buffer, 'thumbnails', 'image');
            thumbnailUrl = result.secure_url;
        }

        const parsedGenres = typeof genres === 'string'
            ? genres.split(',').map(g => g.trim()).filter(Boolean)
            : genres;

        const video = await Video.create({
            title,
            description,
            videoUrl,
            thumbnailUrl,
            duration: Number(duration) || 0,
            releaseYear: releaseYear ? Number(releaseYear) : undefined,
            type: type || 'Movie',
            genres: parsedGenres || [],
            createdBy: req.user.id
        });

        res.status(201).json({ success: true, data: video });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

exports.updateVideo = async (req, res) => {
    try {
        let video = await Video.findById(req.params.id);

        if (!video) {
            return res.status(404).json({ success: false, error: 'Video not found' });
        }

        video = await Video.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: video });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

exports.getVideosByUser = async (req, res) => {
    try {
        const User = require('../models/User');
        const user = await User.findOne({ email: req.params.email });
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });
        const videos = await Video.find({ createdBy: user._id }).sort('-createdAt');
        res.status(200).json({ success: true, count: videos.length, data: videos });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

exports.deleteVideo = async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);

        if (!video) {
            return res.status(404).json({ success: false, error: 'Video not found' });
        }

        await video.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};
