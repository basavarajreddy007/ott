const dotenv = require("dotenv");
dotenv.config();

const requiredEnvVars = ["MONGODB_URI", "JWT_SECRET", "JWT_REFRESH_SECRET"];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`FATAL: Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

const AI_ENABLED = Boolean(process.env.OPENROUTER_API_KEY);
if (!AI_ENABLED) {
  console.warn("WARN: OPENROUTER_API_KEY not set. AI features are disabled.");
}

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const movieRoutes = require("./routes/movieRoutes");
const tvShowRoutes = require("./routes/tvShowRoutes");
const webSeriesRoutes = require("./routes/webSeriesRoutes");
const genreRoutes = require("./routes/genreRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const watchHistoryRoutes = require("./routes/watchHistoryRoutes");
const favoriteRoutes = require("./routes/favoriteRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const adminRoutes = require("./routes/adminRoutes");
const brandRoutes = require("./routes/brandRoutes");
const ratingRoutes = require("./routes/ratingRoutes");
const aiRoutes = require("./routes/aiRoutes");
const errorHandler = require("./middleware/errorHandler");
const { verifySmtpConnection } = require("./services/emailService");
const seedPlans = require("./scripts/seedPlans");

const PORT = process.env.PORT || 5000;
const app = express();

app.set("trust proxy", 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.use(compression());

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:3000",
  "https://basavarajreddy007.github.io",
  "https://ott-gi0u.onrender.com",
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

app.use("/api/payments/webhook", express.raw({ type: "application/json" }));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts, please try again later." },
});

app.use("/api/", globalLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "OTT Backend API is running 🚀",
    status: "OK",
    version: "1.0.0",
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/tvshows", tvShowRoutes);
app.use("/api/webseries", webSeriesRoutes);
app.use("/api/genres", genreRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/history", watchHistoryRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/admin", adminRoutes);

if (AI_ENABLED) {
  app.use("/api/ai", aiRoutes);
} else {
  app.use("/api/ai", (req, res) => {
    res.status(503).json({ success: false, message: "AI features are currently disabled." });
  });
}

app.use("/api/*", (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use(errorHandler);

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected");

    const server = app.listen(PORT, async () => {
      console.log(`Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
      await seedPlans();
      const smtpOk = await verifySmtpConnection();
      if (!smtpOk) {
        console.warn("WARN: SMTP not reachable. Emails will not be sent.");
      }
    });

    const shutdown = (signal) => {
      console.log(`${signal} received. Gracefully shutting down...`);
      server.close(async () => {
        await mongoose.connection.close();
        console.log("MongoDB connection closed.");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    process.on("unhandledRejection", (err) => {
      console.error("Unhandled Promise Rejection:", err.message);
      server.close(() => process.exit(1));
    });

  } catch (err) {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  }
};

startServer();
