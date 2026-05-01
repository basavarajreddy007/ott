require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

async function seed() {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOneAndUpdate(
        { email: 'basavarajreddy000@gmail.com' },
        { role: 'admin' },
        { new: true }
    );
    if (user) {
        console.log(`Admin role set for: ${user.email}`);
    } else {
        console.log('User not found. They must register first, then run this script again.');
    }
    await mongoose.disconnect();
}

seed().catch(console.error);
