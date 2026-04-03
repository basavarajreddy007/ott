const isOwnerOrAdmin = (req, ownerId) => {
    return req.user.role === 'admin' || ownerId.toString() === req.user._id.toString();
};

module.exports = { isOwnerOrAdmin };
