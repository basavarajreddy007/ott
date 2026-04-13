require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

connectDB();

const app = express();

app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));
const ALLOWED_ORIGINS = (process.env.CLIENT_URL || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.length === 0) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    return cb(null, false);
  },
  credentials: true,
}));

app.use('/auth', require('./routes/authRoutes'));
app.use('/users', require('./routes/userRoutes'));
app.use('/videos', require('./routes/videoRoutes'));
app.use('/ai', require('./routes/aiRoutes'));
app.use('/payment', require('./routes/paymentRoutes'));

app.use((err, req, res, next) => {
  const status = err.statusCode || (err.name === 'CastError' ? 400 : 500);
  res.status(status).json({ success: false, error: err.message || 'Server Error' });
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));

