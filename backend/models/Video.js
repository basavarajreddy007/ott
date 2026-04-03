const mongoose = require('mongoose');

const VideoSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    description: {
        type: String,
        default: '',
        maxlength: [1000, 'Description cannot be more than 1000 characters']
    },
    videoUrl: {
        type: String,
        required: [true, 'Please provide the video URL']
    },
    thumbnailUrl: {
        type: String,
        default: ''
    },
    duration: {
        type: Number,
        default: 0
    },
    genres: {
        type: [String],
        default: []
    },
    cast: {
        type: [String]
    },
    director: {
        type: String
    },
    releaseYear: {
        type: Number
    },
    type: {
        type: String,
        enum: ['Movie', 'Series', 'Short', 'Documentary', 'TV Show'],
        default: 'Movie'
    },
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    views: {
        type: Number,
        default: 0
    },
    likes: {
        type: Number,
        default: 0
    },
    likedBy: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }],
    comments: [{
        user: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
        username: { type: String, required: true },
        avatar: { type: String, default: '' },
        text: { type: String, required: true, maxlength: 500 },
        createdAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Video', VideoSchema);
