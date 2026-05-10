const mongoose = require('mongoose');
const cloudinary = require('../config/cloudinary');
const User = require('../models/User');
const Video = require('../models/Video');
const Request = require('../models/Request');

const VALID_ROLES = ['user', 'admin'];
const VALID_PLANS = ['none', 'Basic', 'Standard', 'Premium'];
const VALID_TYPES = ['Movie', 'Series', 'Short', 'Documentary', 'TV Show'];
const VALID_REQUIRED_PLANS = ['Basic', 'Standard', 'Premium'];
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL;

const err400 = (res, msg) => res.status(400).json({ success: false, data: null, error: msg });
const err403 = (res, msg) => res.status(403).json({ success: false, data: null, error: msg });
const err404 = (res, msg) => res.status(404).json({ success: false, data: null, error: msg });
const err500 = (res, err) => res.status(500).json({ success: false, data: null, error: err.message });
const ok     = (res, data = null) => res.json({ success: true, data, error: null });

function getPagination(query) {
    const page  = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    return { page, limit, skip: (page - 1) * limit };
}

function getPublicId(url) {
    if (!url) return null;
    try {
        const i = url.indexOf('/upload/');
        if (i === -1) return null;
        return url.slice(i + 8)
            .replace(/^v\d+\//, '')
            .replace(/^[^/]*\//, m => /^[a-z]+_/.test(m) ? '' : m)
            .replace(/\.[^/.]+$/, '');
    } catch { return null; }
}

async function deleteFromCloudinary(url, resource_type = 'image') {
    const publicId = getPublicId(url);
    if (!publicId) return;
    try {
        const result = await cloudinary.uploader.destroy(publicId, { resource_type });
        if (result.result !== 'ok') console.warn(`[Cloudinary] "${publicId}": ${result.result}`);
    } catch (e) {
        console.error(`[Cloudinary] Failed to delete "${publicId}": ${e.message}`);
    }
}

exports.getStats = async (req, res) => {
    try {
        const [totalUsers, totalVideos, totalRequests, premiumUsers, recentUsers, recentVideos] = await Promise.all([
            User.countDocuments(),
            Video.countDocuments(),
            Request.countDocuments(),
            User.countDocuments({ plan: { $in: ['Basic', 'Standard', 'Premium'] } }),
            User.find().sort('-createdAt').limit(5).select('email username avatar plan role createdAt').lean(),
            Video.find().sort('-createdAt').limit(5).select('title thumbnailUrl views likes createdAt').lean(),
        ]);
        ok(res, { totalUsers, totalVideos, totalRequests, premiumUsers, recentUsers, recentVideos });
    } catch (e) { err500(res, e); }
};

exports.getAllUsers = async (req, res) => {
    try {
        const { page, limit, skip } = getPagination(req.query);
        const [users, total] = await Promise.all([
            User.find().sort('-createdAt').skip(skip).limit(limit).select('-password -otp -otpExpire').lean(),
            User.countDocuments(),
        ]);
        ok(res, { users, total, page, limit });
    } catch (e) { err500(res, e); }
};

exports.updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return err400(res, 'Invalid user ID');
        if (!VALID_ROLES.includes(req.body.role)) return err400(res, `Role must be one of: ${VALID_ROLES.join(', ')}`);
        const user = await User.findByIdAndUpdate(id, { role: req.body.role }, { new: true }).select('-password -otp -otpExpire').lean();
        if (!user) return err404(res, 'User not found');
        ok(res, user);
    } catch (e) { err500(res, e); }
};

exports.updateUserPlan = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return err400(res, 'Invalid user ID');
        if (!VALID_PLANS.includes(req.body.plan)) return err400(res, `Plan must be one of: ${VALID_PLANS.join(', ')}`);
        const user = await User.findByIdAndUpdate(id, { plan: req.body.plan }, { new: true }).select('-password -otp -otpExpire').lean();
        if (!user) return err404(res, 'User not found');
        ok(res, user);
    } catch (e) { err500(res, e); }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return err400(res, 'Invalid user ID');
        if (id === req.user._id.toString()) return err403(res, 'Cannot delete your own account');
        const user = await User.findById(id).lean();
        if (!user) return err404(res, 'User not found');
        if (SUPER_ADMIN_EMAIL && user.email === SUPER_ADMIN_EMAIL) return err403(res, 'Cannot delete the super admin');
        await User.deleteOne({ _id: id });
        ok(res);
    } catch (e) { err500(res, e); }
};

exports.getAllVideos = async (req, res) => {
    try {
        const { page, limit, skip } = getPagination(req.query);
        const [videos, total] = await Promise.all([
            Video.find().sort('-createdAt').skip(skip).limit(limit).populate('createdBy', 'email username avatar').lean(),
            Video.countDocuments(),
        ]);
        ok(res, { videos, total, page, limit });
    } catch (e) { err500(res, e); }
};

exports.updateVideo = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return err400(res, 'Invalid video ID');

        const updates = {};
        for (const field of ['title', 'description', 'genres', 'releaseYear', 'type', 'requiredPlan', 'featured']) {
            if (!(field in req.body)) continue;
            const val = req.body[field];
            if (field === 'genres') {
                const genres = typeof val === 'string' ? val.split(',').map(g => g.trim()).filter(Boolean) : val;
                if (!Array.isArray(genres)) return err400(res, 'genres must be an array or comma-separated string');
                updates.genres = genres;
            } else if (field === 'releaseYear') {
                const year = parseInt(val);
                if (isNaN(year) || year < 1888 || year > new Date().getFullYear() + 2) return err400(res, 'Invalid releaseYear');
                updates.releaseYear = year;
            } else if (field === 'type') {
                if (!VALID_TYPES.includes(val)) return err400(res, `type must be one of: ${VALID_TYPES.join(', ')}`);
                updates.type = val;
            } else if (field === 'requiredPlan') {
                if (!VALID_REQUIRED_PLANS.includes(val)) return err400(res, `requiredPlan must be one of: ${VALID_REQUIRED_PLANS.join(', ')}`);
                updates.requiredPlan = val;
            } else if (field === 'featured') {
                updates.featured = Boolean(val);
            } else {
                updates[field] = val;
            }
        }

        if (!Object.keys(updates).length) return err400(res, 'No valid fields provided for update');
        const video = await Video.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).lean();
        if (!video) return err404(res, 'Video not found');
        ok(res, video);
    } catch (e) { err500(res, e); }
};

exports.deleteVideo = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return err400(res, 'Invalid video ID');
        const video = await Video.findById(id).lean();
        if (!video) return err404(res, 'Video not found');
        await Promise.allSettled([
            deleteFromCloudinary(video.videoUrl, 'video'),
            deleteFromCloudinary(video.thumbnailUrl, 'image'),
        ]);
        await Video.deleteOne({ _id: id });
        ok(res);
    } catch (e) { err500(res, e); }
};

exports.getAllRequests = async (req, res) => {
    try {
        const { page, limit, skip } = getPagination(req.query);
        const [requests, total] = await Promise.all([
            Request.find().sort('-createdAt').skip(skip).limit(limit).lean(),
            Request.countDocuments(),
        ]);
        ok(res, { requests, total, page, limit });
    } catch (e) { err500(res, e); }
};

exports.deleteRequest = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return err400(res, 'Invalid request ID');
        const request = await Request.findById(id).lean();
        if (!request) return err404(res, 'Request not found');
        await Request.deleteOne({ _id: id });
        ok(res);
    } catch (e) { err500(res, e); }
};
