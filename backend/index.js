require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

connectDB();

const app = express();

app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

const allowedOrigins = [
    'https://ott-kp7e.onrender.com',
    'http://localhost:5173',
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, Postman)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS policy: origin ${origin} not allowed`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Explicitly handle preflight for all routes
app.options('*', cors());

app.use('/auth',     require('./routes/authRoutes'));
app.use('/users',    require('./routes/userRoutes'));
app.use('/videos',   require('./routes/videoRoutes'));
app.use('/payment',  require('./routes/paymentRoutes'));
app.use('/requests', require('./routes/requestRoutes'));
app.use('/admin',    require('./routes/adminRoutes'));
app.use('/api/ai',   require('./routes/aiRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*splat', (_req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

app.use((err, _req, res, _next) => {
    const status = err.statusCode || (err.name === 'CastError' ? 400 : 500);
    res.status(status).json({ success: false, error: err.message || 'Server Error' });
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));
