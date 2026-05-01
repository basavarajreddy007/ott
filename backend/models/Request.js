const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true, unique: true },
    requestedBy: { type: String, default: 'Anonymous' },
    count: { type: Number, default: 1 }
}, { timestamps: true });

module.exports = mongoose.model('Request', requestSchema);
