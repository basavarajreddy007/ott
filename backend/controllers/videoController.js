const Video = require('../models/Video');
const User = require('../models/User');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
});

function uploadFromBuffer(buffer, folder = 'videos', resource_type = 'auto') {
    return new Promise((resolve, reject) => {
        streamifier.createReadStream(buffer).pipe(
            cloudinary.uploader.upload_stream(
                { folder, resource_type, chunk_size: 6000000 },
                (err, result) => result ? resolve(result) : reject(err)
            )
        );
    });
}

function getPublicId(url) {
    const parts = url?.split('/upload/');
    if (!parts || parts.length < 2) return null;
    return parts[1].replace(/^v\d+\//, '').replace(/\.[^/.]+$/, '');
}

async function deleteFromCloudinary(url, resource_type = 'image') {
    const publicId = getPublicId(url);
    if (!publicId) return;
    try {
        await cloudinary.uploader.destroy(publicId, { resource_type });
    } catch (err) {
        console.error('Cloudinary delete failed:', err.message);
    }
}

async function uploadFile(files, field, folder, type) {
    const file = files?.[field]?.[0];
    if (!file) return null;
    const result = await uploadFromBuffer(file.buffer, folder, type);
    return result.secure_url;
}

function parseGenres(genres) {
    if (typeof genres === 'string') return genres.split(',').map(g => g.trim()).filter(Boolean);
    return genres ?? [];
}

const isOwnerOrAdmin = (req, ownerId) =>
    req.user.role === 'admin' || ownerId.toString() === req.user._id.toString();

const notFound = (res, msg = 'Not found') => res.status(404).json({ success: false, error: msg });
const forbidden = (res, msg = 'Not authorized') => res.status(403).json({ success: false, error: msg });

const PLAN_RANK = { none: 1, Basic: 1, Standard: 2, Premium: 3 };
const UPDATE_FIELDS = ['title', 'description', 'thumbnailUrl', 'duration', 'genres', 'cast', 'director', 'releaseYear', 'type', 'requiredPlan'];

exports.searchVideos = wrap(async (req, res) => {
    const { q } = req.query;
    if (!q?.trim()) return res.status(400).json({ success: false, error: 'Query required' });

    const regex = new RegExp(q.trim(), 'i');
    const videos = await Video.find({ $or: [{ title: regex }, { description: regex }, { genres: regex }] })
        .sort('-createdAt').limit(50).lean();

    res.json({ success: true, count: videos.length, data: videos });
});

exports.getVideos = wrap(async (req, res) => {
    const { select, sort, page: rawPage, limit: rawLimit, ...filter } = req.query;
    const page = Math.max(1, parseInt(rawPage) || 1);
    const limit = Math.max(1, parseInt(rawLimit) || 20);
    const skip = (page - 1) * limit;

    let query = Video.find(filter).skip(skip).limit(limit).sort(sort ? sort.split(',').join(' ') : '-createdAt');
    if (select) query = query.select(select.split(',').join(' '));

    const [videos, total] = await Promise.all([query.lean(), Video.countDocuments(filter)]);

    const pagination = {};
    if (skip + limit < total) pagination.next = { page: page + 1, limit };
    if (skip > 0) pagination.prev = { page: page - 1, limit };

    res.json({ success: true, count: videos.length, pagination, data: videos });
});

exports.getVideo = wrap(async (req, res) => {
    const video = await Video.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true }).lean();
    if (!video) return notFound(res, 'Video not found');

    let userRank = 1; // default: Basic plan rank for guests
    if (req.user) {
        const user = await User.findById(req.user.id).select('plan').lean();
        userRank = PLAN_RANK[user?.plan] || 1;
    }
    const videoRank = PLAN_RANK[video.requiredPlan] || 1;

    if (userRank < videoRank) {
        return res.status(403).json({ success: false, message: `Upgrade to ${video.requiredPlan} plan to watch this video` });
    }

    res.json({ success: true, data: video });
});

exports.createVideo = wrap(async (req, res) => {
    const { title, description, videoUrl: bodyVideoUrl, thumbnailUrl: bodyThumbUrl, duration, genres, releaseYear, type, requiredPlan } = req.body;

    const [videoUrl, thumbnailUrl] = await Promise.all([
        uploadFile(req.files, 'video', 'videos', 'video'),
        uploadFile(req.files, 'thumbnail', 'thumbnails', 'image')
    ]);

    const video = await Video.create({
        title,
        description,
        videoUrl: videoUrl ?? bodyVideoUrl,
        thumbnailUrl: thumbnailUrl ?? bodyThumbUrl,
        duration: Number(duration) || 0,
        releaseYear: releaseYear ? Number(releaseYear) : undefined,
        type: type || 'Movie',
        genres: parseGenres(genres),
        requiredPlan: requiredPlan || 'Basic',
        createdBy: req.user.id
    });

    res.status(201).json({ success: true, data: video });
});

exports.updateVideo = wrap(async (req, res) => {
    const video = await Video.findById(req.params.id);
    if (!video) return notFound(res, 'Video not found');
    if (!isOwnerOrAdmin(req, video.createdBy)) return forbidden(res, 'Not authorized to update this video');

    const updates = Object.fromEntries(UPDATE_FIELDS.filter(f => f in req.body).map(f => [f, req.body[f]]));
    const updated = await Video.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).lean();

    res.json({ success: true, data: updated });
});

exports.deleteVideo = wrap(async (req, res) => {
    const video = await Video.findById(req.params.id);
    if (!video) return notFound(res, 'Video not found');
    if (!isOwnerOrAdmin(req, video.createdBy)) return forbidden(res, 'Not authorized to delete this video');

    await Promise.allSettled([
        deleteFromCloudinary(video.videoUrl, 'video'),
        deleteFromCloudinary(video.thumbnailUrl, 'image')
    ]);
    await video.deleteOne();

    res.json({ success: true, data: {} });
});

exports.likeVideo = wrap(async (req, res) => {
    const video = await Video.findById(req.params.id);
    if (!video) return notFound(res, 'Video not found');

    const userId = req.user._id;
    const liked = video.likedBy.some(id => id.equals(userId));

    if (liked) {
        video.likedBy.pull(userId);
        video.likes = Math.max(0, video.likes - 1);
    } else {
        video.likedBy.push(userId);
        video.likes += 1;
    }

    await video.save();
    res.json({ success: true, likes: video.likes, liked: !liked });
});

exports.addComment = wrap(async (req, res) => {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ success: false, error: 'Comment text required' });

    const video = await Video.findById(req.params.id);
    if (!video) return notFound(res, 'Video not found');

    video.comments.push({
        user: req.user._id,
        username: req.user.username || req.user.email,
        avatar: req.user.avatar || '',
        text: text.trim()
    });

    await video.save();
    res.status(201).json({ success: true, data: video.comments.at(-1) });
});

exports.deleteComment = wrap(async (req, res) => {
    const video = await Video.findById(req.params.id);
    if (!video) return notFound(res, 'Video not found');

    const comment = video.comments.id(req.params.commentId);
    if (!comment) return notFound(res, 'Comment not found');
    if (!isOwnerOrAdmin(req, comment.user)) return forbidden(res);

    comment.deleteOne();
    await video.save();
    res.json({ success: true, data: {} });
});

exports.subscribeToCreator = wrap(async (req, res) => {
    const { creatorId } = req.params;
    if (creatorId === req.user._id.toString()) {
        return res.status(400).json({ success: false, error: 'Cannot subscribe to yourself' });
    }

    const [viewer, creator] = await Promise.all([User.findById(req.user._id), User.findById(creatorId)]);
    if (!creator) return notFound(res, 'Creator not found');

    const subscribed = viewer.subscribedTo.some(id => id.equals(creatorId));

    if (subscribed) {
        viewer.subscribedTo.pull(creatorId);
        creator.followers = Math.max(0, creator.followers - 1);
    } else {
        viewer.subscribedTo.push(creatorId);
        creator.followers += 1;
    }

    await Promise.all([viewer.save(), creator.save()]);
    res.json({ success: true, subscribed: !subscribed, followers: creator.followers });
});

exports.updateThumbnail = wrap(async (req, res) => {
    const video = await Video.findById(req.params.id);
    if (!video) return notFound(res, 'Video not found');
    if (!isOwnerOrAdmin(req, video.createdBy)) return forbidden(res);
    if (!req.file) return res.status(400).json({ success: false, error: 'No thumbnail file provided' });

    const uploaded = await uploadFromBuffer(req.file.buffer, 'thumbnails', 'image');
    video.thumbnailUrl = uploaded.secure_url;
    await video.save();

    res.json({ success: true, data: video });
});

exports.getVideosByUser = wrap(async (req, res) => {
    const user = await User.findOne({ email: req.params.email }).lean();
    if (!user) return notFound(res, 'User not found');

    const videos = await Video.find({ createdBy: user._id }).sort('-createdAt').lean();
    res.json({ success: true, count: videos.length, data: videos });
});
