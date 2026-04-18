const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

const SAFE_FIELDS = '-password -otp -otpExpire';

exports.getUsers = asyncHandler(async (req, res) => {
    const users = await User.find().lean();
    res.json({ success: true, count: users.length, data: users });
});

exports.getUserByEmail = asyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.params.email }).select(SAFE_FIELDS).lean();
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: user });
});

exports.updateUserByEmail = asyncHandler(async (req, res) => {
    if (req.user.email !== req.params.email) {
        return res.status(403).json({ success: false, error: 'Not allowed to update this profile' });
    }

    const { username, bio, avatar } = req.body;
    const fields = {};
    if (username !== undefined) fields.username = username;
    if (bio !== undefined) fields.bio = bio;
    if (avatar !== undefined) fields.avatar = avatar;

    const user = await User.findOneAndUpdate({ email: req.params.email }, fields, { new: true, runValidators: true }).select(SAFE_FIELDS);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    res.json({ success: true, data: user });
});
