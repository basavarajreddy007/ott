const User = require('../models/User');

exports.getUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

exports.getUserByEmail = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email }).select('-password -otp -otpExpire');
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });
        res.status(200).json({ success: true, data: user });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

exports.updateUserByEmail = async (req, res) => {
    try {
        if (req.user.email !== req.params.email) {
            return res.status(403).json({ success: false, error: 'Not allowed to update this profile' });
        }
        const { username, bio, avatar } = req.body;
        const update = {};
        if (username !== undefined) update.username = username;
        if (bio !== undefined) update.bio = bio;
        if (avatar !== undefined) update.avatar = avatar;

        const user = await User.findOneAndUpdate(
            { email: req.params.email },
            update,
            { new: true, runValidators: true }
        ).select('-password -otp -otpExpire');
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });
        res.status(200).json({ success: true, data: user });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};
