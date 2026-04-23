const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    try {
        const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) return res.status(401).json({ success: false, error: 'User not found' });
        req.user = user;
        next();
    } catch {
        res.status(401).json({ success: false, error: 'Session expired, please log in again' });
    }
};

// Attaches user if token is present, but does NOT block unauthenticated requests.
// Use for routes that are public but need user context when available.
exports.optionalProtect = async (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return next();
    try {
        const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (user) req.user = user;
    } catch {
        // invalid/expired token — just continue as guest
    }
    next();
};

exports.authorize = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ success: false, error: 'Not authorized for this action' });
    }
    next();
};
