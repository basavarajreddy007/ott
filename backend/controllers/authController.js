const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { sendOtpEmail } = require('../services/emailService');

function sendTokenResponse(user, statusCode, res) {
    res.status(statusCode).json({
        success: true,
        token: user.getSignedJwtToken(),
        user: {
            _id: user._id,
            email: user.email,
            username: user.username,
            avatar: user.avatar,
            role: user.role,
            subscribedTo: user.subscribedTo ?? []
        }
    });
}

exports.register = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    // Check if user already exists to avoid duplicate key error
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ success: false, error: 'User already exists' });
    }
    const username = email.split('@')[0] + '_' + Math.floor(Math.random() * 10000);
    const user = await User.create({ email, password, username });
    sendTokenResponse(user, 201, res);
});

exports.sendOtp = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, error: 'Please provide an email' });
    }

    let user = await User.findOne({ email });

    if (!user) {
        const tempPassword = Math.random().toString(36).slice(-10);
        const tempUsername = email.split('@')[0] + '_' + Math.floor(Math.random() * 10000);
        user = await User.create({ email, password: tempPassword, username: tempUsername });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpire = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    try {
        await sendOtpEmail(user.email, otp);
    } catch (err) {
        console.error('Email send failed:', err.message);
        return res.status(500).json({ success: false, error: `Email error: ${err.message}` });
    }

    res.json({ success: true, message: 'OTP sent to email' });
});

exports.verifyOtp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ success: false, error: 'Email and OTP required' });
    }

    const user = await User.findOne({
        email,
        otp,
        otpExpire: { $gt: Date.now() }
    });

    if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid or expired OTP' });
    }

    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res);
});

exports.login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Please provide an email and password' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    sendTokenResponse(user, 200, res);
});

exports.getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    res.json({ success: true, data: user });
});
