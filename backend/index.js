require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

connectDB();

const app = express();

app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

const ALLOWED = (process.env.CLIENT_URL || '').split(',').map(o => o.trim()).filter(Boolean);

app.use(cors({
    origin: (origin, cb) => (!origin || !ALLOWED.length || ALLOWED.includes(origin)) ? cb(null, true) : cb(null, false),
    credentials: true
}));

app.use('/auth',    require('./routes/authRoutes'));
app.use('/users',   require('./routes/userRoutes'));
app.use('/videos',  require('./routes/videoRoutes'));
app.use('/ai',      require('./routes/aiRoutes'));
app.use('/payment', require('./routes/paymentRoutes'));

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

app.use((err, _req, res, _next) => {
    const status = err.statusCode || (err.name === 'CastError' ? 400 : 500);
    res.status(status).json({ success: false, error: err.message || 'Server Error' });
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));
