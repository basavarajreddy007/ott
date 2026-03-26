const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    avatar: {
        type: String,
        default: 'default_avatar.png'
    },
    watchHistory: [{
        video: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Video'
        },
        progress: {
            type: Number,
            default: 0
        },
        lastWatched: {
            type: Date,
            default: Date.now
        }
    }],
    myList: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video'
    }]
}, { timestamps: true });

module.exports = mongoose.model('Profile', ProfileSchema);
