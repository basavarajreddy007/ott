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
        required: [true, 'Please add a description'],
        maxlength: [1000, 'Description cannot be more than 1000 characters']
    },
    videoUrl: {
        type: String,
        required: [true, 'Please provide the video URL']
    },
    thumbnailUrl: {
        type: String,
        required: [true, 'Please provide the thumbnail URL']
    },
    duration: {
        type: Number,
        required: true
    },
    genres: {
        type: [String],
        required: true
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
        enum: ['Movie', 'TV Show'],
        required: true
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
    }
}, { timestamps: true });

module.exports = mongoose.model('Video', VideoSchema);
