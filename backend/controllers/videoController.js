const Video = require('../models/Video');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { isOwnerOrAdmin } = require('../utils/authHelpers');
const { uploadFromBuffer, deleteFromCloudinary } = require('../utils/uploadCloudinary');

const notFound = (res, msg = 'Not found') => res.status(404).json({ success: false, error: msg });
const forbidden = (res, msg = 'Not authorized') => res.status(403).json({ success: false, error: msg });

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

const VIDEO_UPDATE_FIELDS = ['title', 'description', 'thumbnailUrl', 'duration', 'genres', 'cast', 'director', 'releaseYear', 'type'];

exports.searchVideos = asyncHandler(async (req, res) => {
    const { q } = req.query;
    if (!q?.trim()) return res.status(400).json({ success: false, error: 'Query parameter q is required' });

    const regex = new RegExp(q.trim(), 'i');
    const videos = await Video.find({ $or: [{ title: regex }, { description: regex }, { genres: regex }] })
        .sort('-createdAt').limit(50).lean();

    res.json({ success: true, count: videos.length, data: videos });
});

exports.getVideos = asyncHandler(async (req, res) => {
    const { select, sort, page: rawPage, limit: rawLimit, ...filter } = req.query;

    const page = Math.max(1, parseInt(rawPage, 10) || 1);
    const limit = Math.max(1, parseInt(rawLimit, 10) || 20);
    const skip = (page - 1) * limit;

    let query = Video.find(filter).skip(skip).limit(limit)
        .sort(sort ? sort.split(',').join(' ') : '-createdAt');

    if (select) query = query.select(select.split(',').join(' '));

    const [videos, total] = await Promise.all([query.lean(), Video.countDocuments(filter)]);

    const pagination = {};
    if (skip + limit < total) pagination.next = { page: page + 1, limit };
    if (skip > 0) pagination.prev = { page: page - 1, limit };

    res.json({ success: true, count: videos.length, pagination, data: videos });
});

exports.getVideo = asyncHandler(async (req, res) => {
    const video = await Video.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true }).lean();
    if (!video) return notFound(res, 'Video not found');
    res.json({ success: true, data: video });
});

exports.createVideo = asyncHandler(async (req, res) => {
    const { title, description, videoUrl: bodyVideoUrl, thumbnailUrl: bodyThumbUrl, duration, genres, releaseYear, type } = req.body;

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
        createdBy: req.user.id
    });

    res.status(201).json({ success: true, data: video });
});

exports.updateVideo = asyncHandler(async (req, res) => {
    const video = await Video.findById(req.params.id);
    if (!video) return notFound(res, 'Video not found');
    if (!isOwnerOrAdmin(req, video.createdBy)) return forbidden(res, 'Not authorized to update this video');

    const updates = Object.fromEntries(VIDEO_UPDATE_FIELDS.filter(f => f in req.body).map(f => [f, req.body[f]]));
    const updated = await Video.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).lean();

    res.json({ success: true, data: updated });
});

exports.deleteVideo = asyncHandler(async (req, res) => {
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

exports.likeVideo = asyncHandler(async (req, res) => {
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

exports.addComment = asyncHandler(async (req, res) => {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ success: false, error: 'Comment text is required' });

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

exports.deleteComment = asyncHandler(async (req, res) => {
    const video = await Video.findById(req.params.id);
    if (!video) return notFound(res, 'Video not found');

    const comment = video.comments.id(req.params.commentId);
    if (!comment) return notFound(res, 'Comment not found');
    if (!isOwnerOrAdmin(req, comment.user)) return forbidden(res);

    comment.deleteOne();
    await video.save();
    res.json({ success: true, data: {} });
});

exports.subscribeToCreator = asyncHandler(async (req, res) => {
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

exports.updateThumbnail = asyncHandler(async (req, res) => {
    const video = await Video.findById(req.params.id);
    if (!video) return notFound(res, 'Video not found');
    if (!isOwnerOrAdmin(req, video.createdBy)) return forbidden(res);
    if (!req.file) return res.status(400).json({ success: false, error: 'No thumbnail file provided' });

    const uploaded = await uploadFromBuffer(req.file.buffer, 'thumbnails', 'image');
    video.thumbnailUrl = uploaded.secure_url;
    await video.save();

    res.json({ success: true, data: video });
});

exports.getVideosByUser = asyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.params.email }).lean();
    if (!user) return notFound(res, 'User not found');

    const videos = await Video.find({ createdBy: user._id }).sort('-createdAt').lean();
    res.json({ success: true, count: videos.length, data: videos });
});
