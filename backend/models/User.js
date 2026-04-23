const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email']
    },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    otp: String,
    otpExpire: Date,
    username: { type: String, trim: true, default: '' },
    avatar: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: 300 },
    followers: { type: Number, default: 0 },
    plan: { type: String, enum: ['none', 'Basic', 'Standard', 'Premium'], default: 'none' },
    subscribedTo: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now }
});

UserSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.getSignedJwtToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '30d'
    });
};

UserSchema.methods.matchPassword = function (entered) {
    return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', UserSchema);
