const User = require('../models/User');

const SAFE = '-password -otp -otpExpire';

exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().lean();
        res.json({ success: true, count: users.length, data: users });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getUserByEmail = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email }).select(SAFE).lean();
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });
        res.json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.updateUserByEmail = async (req, res) => {
    try {
        if (req.user.email !== req.params.email) {
            return res.status(403).json({ success: false, error: 'Not allowed to update this profile' });
        }

        const { username, bio, avatar } = req.body;
        const fields = {
            ...(username !== undefined && { username }),
            ...(bio      !== undefined && { bio }),
            ...(avatar   !== undefined && { avatar }),
        };

        const user = await User.findOneAndUpdate({ email: req.params.email }, fields, { new: true, runValidators: true }).select(SAFE);
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });

        res.json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
