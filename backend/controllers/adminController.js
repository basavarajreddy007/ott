const User = require('../models/User');
const Video = require('../models/Video');
const Request = require('../models/Request');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
});

function getPublicId(url) {
    const parts = url?.split('/upload/');
    if (!parts || parts.length < 2) return null;
    return parts[1].replace(/^v\d+\//, '').replace(/\.[^/.]+$/, '');
}

async function deleteFromCloudinary(url, resource_type = 'image') {
    const publicId = getPublicId(url);
    if (!publicId) return;
    try { await cloudinary.uploader.destroy(publicId, { resource_type }); } catch (_) {}
}

exports.getStats = async (req, res) => {
    try {
        const [totalUsers, totalVideos, totalRequests, premiumUsers] = await Promise.all([
            User.countDocuments(),
            Video.countDocuments(),
            Request.countDocuments(),
            User.countDocuments({ plan: { $in: ['Basic', 'Standard', 'Premium'] } })
        ]);
        const recentUsers = await User.find().sort('-createdAt').limit(5).select('email username avatar plan role createdAt').lean();
        const recentVideos = await Video.find().sort('-createdAt').limit(5).select('title thumbnailUrl views likes createdAt').lean();
        res.json({ success: true, data: { totalUsers, totalVideos, totalRequests, premiumUsers, recentUsers, recentVideos } });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().sort('-createdAt').select('-password -otp -otpExpire').lean();
        res.json({ success: true, count: users.length, data: users });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ success: false, error: 'Invalid role' });
        }
        const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password -otp -otpExpire');
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });
        res.json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.updateUserPlan = async (req, res) => {
    try {
        const { plan } = req.body;
        if (!['none', 'Basic', 'Standard', 'Premium'].includes(plan)) {
            return res.status(400).json({ success: false, error: 'Invalid plan' });
        }
        const user = await User.findByIdAndUpdate(req.params.id, { plan }, { new: true }).select('-password -otp -otpExpire');
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });
        res.json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });
        if (user.email === 'basavarajreddy000@gmail.com') {
            return res.status(403).json({ success: false, error: 'Cannot delete the super admin' });
        }
        await user.deleteOne();
        res.json({ success: true, data: {} });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getAllVideos = async (req, res) => {
    try {
        const videos = await Video.find().sort('-createdAt').populate('createdBy', 'email username avatar').lean();
        res.json({ success: true, count: videos.length, data: videos });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.updateVideo = async (req, res) => {
    try {
        const allowed = ['title', 'description', 'genres', 'releaseYear', 'type', 'requiredPlan', 'featured'];
        const updates = {};
        allowed.forEach(function(f) { if (f in req.body) updates[f] = req.body[f]; });
        if (updates.genres && typeof updates.genres === 'string') {
            updates.genres = updates.genres.split(',').map(function(g) { return g.trim(); }).filter(Boolean);
        }
        const video = await Video.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).lean();
        if (!video) return res.status(404).json({ success: false, error: 'Video not found' });
        res.json({ success: true, data: video });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.deleteVideo = async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ success: false, error: 'Video not found' });
        await Promise.allSettled([
            deleteFromCloudinary(video.videoUrl, 'video'),
            deleteFromCloudinary(video.thumbnailUrl, 'image')
        ]);
        await video.deleteOne();
        res.json({ success: true, data: {} });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getAllRequests = async (req, res) => {
    try {
        const requests = await Request.find().sort('-createdAt').lean();
        res.json({ success: true, count: requests.length, data: requests });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.deleteRequest = async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);
        if (!request) return res.status(404).json({ success: false, error: 'Request not found' });
        await request.deleteOne();
        res.json({ success: true, data: {} });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
