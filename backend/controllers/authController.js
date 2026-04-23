const User = require('../models/User');
const { sendOtpEmail } = require('../services/emailService');

const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const genUsername = email => email.split('@')[0] + '_' + Math.floor(Math.random() * 10000);

function sendToken(user, status, res) {
    res.status(status).json({
        success: true,
        token: user.getSignedJwtToken(),
        user: {
            _id: user._id,
            email: user.email,
            username: user.username,
            avatar: user.avatar,
            role: user.role,
            plan: user.plan || 'none',
            subscribedTo: user.subscribedTo ?? []
        }
    });
}

exports.register = wrap(async (req, res) => {
    const { email, password } = req.body;
    if (await User.findOne({ email })) {
        return res.status(400).json({ success: false, error: 'User already exists' });
    }
    const user = await User.create({ email, password, username: genUsername(email) });
    sendToken(user, 201, res);
});

exports.login = wrap(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password required' });
    }
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    sendToken(user, 200, res);
});

exports.sendOtp = wrap(async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email required' });

    let user = await User.findOne({ email });
    if (!user) {
        user = await User.create({ email, password: Math.random().toString(36).slice(-10), username: genUsername(email) });
    }

    user.otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otpExpire = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    try {
        await sendOtpEmail(user.email, user.otp);
    } catch (err) {
        return res.status(500).json({ success: false, error: `Email error: ${err.message}` });
    }

    res.json({ success: true, message: 'OTP sent' });
});

exports.verifyOtp = wrap(async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, error: 'Email and OTP required' });

    const user = await User.findOne({ email, otp, otpExpire: { $gt: Date.now() } });
    if (!user) return res.status(401).json({ success: false, error: 'Invalid or expired OTP' });

    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save({ validateBeforeSave: false });

    sendToken(user, 200, res);
});

exports.getMe = wrap(async (req, res) => {
    const user = await User.findById(req.user.id);
    res.json({ success: true, data: user });
});
