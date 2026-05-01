const Request = require('../models/Request');

exports.createRequest = async (req, res) => {
    try {
        const { title } = req.body;
        if (!title || !title.trim()) {
            return res.status(400).json({ success: false, error: 'Title is required' });
        }

        const normalised = title.trim();
        const regex = new RegExp(`^${normalised}$`, 'i');
        const existing = await Request.findOne({ title: regex });

        if (existing) {
            existing.count += 1;
            await existing.save();
            return res.json({ success: true, data: existing, incremented: true });
        }

        const request = await Request.create({
            title: normalised,
            requestedBy: req.user ? req.user.email : 'Anonymous'
        });
        res.status(201).json({ success: true, data: request });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getRequests = async (req, res) => {
    try {
        const requests = await Request.find().sort('-count -createdAt').lean();
        res.json({ success: true, data: requests });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
