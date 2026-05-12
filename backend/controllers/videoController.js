const Video = require('../models/Video');
const User = require('../models/User');

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

exports.searchVideos = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q?.trim()) return res.status(400).json({ success: false, error: 'Query required' });
        const regex = new RegExp(q.trim(), 'i');
        const videos = await Video.find({ $or: [{ title: regex }, { description: regex }, { genres: regex }] })
            .sort('-createdAt').limit(50).lean();
        res.json({ success: true, count: videos.length, data: videos });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getVideos = async (req, res) => {
    try {
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
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getVideo = async (req, res) => {
    try {
        const video = await Video.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true }).lean();
        if (!video) return notFound(res, 'Video not found');

        let userRank = 1;
        if (req.user) {
            if (req.user.role === 'admin') {
                return res.json({ success: true, data: video });
            }
            const user = await User.findById(req.user._id).select('plan').lean();
            userRank = PLAN_RANK[user?.plan] || 1;
        }
        const videoRank = PLAN_RANK[video.requiredPlan] || 1;
        if (userRank < videoRank) {
            return res.status(403).json({ success: false, error: `Upgrade to ${video.requiredPlan} plan to watch this video` });
        }

        res.json({ success: true, data: video });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.createVideo = async (req, res) => {
    try {
        const { title, description, videoUrl, thumbnailUrl, duration, genres, releaseYear, type, requiredPlan } = req.body;

        if (!title?.trim()) return res.status(400).json({ success: false, error: 'Title is required' });
        if (!description?.trim()) return res.status(400).json({ success: false, error: 'Description is required' });
        if (!videoUrl?.trim()) return res.status(400).json({ success: false, error: 'Video URL is required' });

        const video = await Video.create({
            title: title.trim(),
            description: description.trim(),
            videoUrl: videoUrl.trim(),
            thumbnailUrl: thumbnailUrl?.trim() || '',
            duration: Number(duration) || 0,
            releaseYear: releaseYear ? Number(releaseYear) : undefined,
            type: type || 'Movie',
            genres: parseGenres(genres),
            requiredPlan: requiredPlan || 'Basic',
            createdBy: req.user._id
        });

        res.status(201).json({ success: true, data: video });
    } catch (err) {
        console.error('createVideo error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.updateVideo = async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return notFound(res, 'Video not found');
        if (!isOwnerOrAdmin(req, video.createdBy)) return forbidden(res, 'Not authorized to update this video');

        const updates = Object.fromEntries(UPDATE_FIELDS.filter(f => f in req.body).map(f => [f, req.body[f]]));
        const updated = await Video.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).lean();

        res.json({ success: true, data: updated });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.deleteVideo = async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return notFound(res, 'Video not found');
        if (!isOwnerOrAdmin(req, video.createdBy)) return forbidden(res, 'Not authorized to delete this video');

        await video.deleteOne();
        res.json({ success: true, data: {} });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.likeVideo = async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return notFound(res, 'Video not found');

        const userId = req.user._id;
        const liked = video.likedBy.some(id => id && id.equals && id.equals(userId));

        if (liked) {
            video.likedBy.pull(userId);
        } else {
            video.likedBy.push(userId);
        }
        // recount from source of truth to avoid drift
        video.likes = video.likedBy.length;

        await video.save();
        res.json({ success: true, likes: video.likes, liked: !liked });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.addComment = async (req, res) => {
    try {
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
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.deleteComment = async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return notFound(res, 'Video not found');

        const comment = video.comments.id(req.params.commentId);
        if (!comment) return notFound(res, 'Comment not found');
        if (!isOwnerOrAdmin(req, comment.user)) return forbidden(res);

        comment.deleteOne();
        await video.save();
        res.json({ success: true, data: {} });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.subscribeToCreator = async (req, res) => {
    try {
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
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.updateThumbnail = async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return notFound(res, 'Video not found');
        if (!isOwnerOrAdmin(req, video.createdBy)) return forbidden(res);

        const { thumbnailUrl } = req.body;
        if (!thumbnailUrl?.trim()) return res.status(400).json({ success: false, error: 'thumbnailUrl is required' });

        video.thumbnailUrl = thumbnailUrl.trim();
        await video.save();

        res.json({ success: true, data: video });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getVideosByUser = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email }).lean();
        if (!user) return notFound(res, 'User not found');

        const videos = await Video.find({ createdBy: user._id }).sort('-createdAt').lean();
        res.json({ success: true, count: videos.length, data: videos });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
