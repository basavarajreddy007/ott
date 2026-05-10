const mongoose = require('mongoose');

const ScriptSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    messages: [{
        role: { type: String, enum: ['user', 'assistant'], required: true },
        content: { type: String, required: true }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Script', ScriptSchema);
