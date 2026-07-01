



const dotenv = require("dotenv");
dotenv.config();


const REQUIRED = ["MONGODB_URI", "JWT_SECRET", "JWT_REFRESH_SECRET"];

const missing = REQUIRED.filter((key) => !process.env[key]);
if (missing.length > 0) {
  missing.forEach((key) =>
    console.error(`FATAL: Missing required environment variable: ${key}`)
  );
  process.exit(1);
}


const AI_ENABLED = Boolean(process.env.OPENROUTER_API_KEY);
if (!AI_ENABLED) {
  console.warn("WARN: OPENROUTER_API_KEY not set. AI features are disabled.");
}

const STRIPE_ENABLED = Boolean(process.env.STRIPE_SECRET_KEY);
if (!STRIPE_ENABLED) {
  console.warn("WARN: STRIPE_SECRET_KEY not set. Payment features are disabled (mock mode).");
}

const SMTP_ENABLED =
  Boolean(process.env.SMTP_HOST) &&
  Boolean(process.env.SMTP_USER) &&
  Boolean(process.env.SMTP_PASS);
if (!SMTP_ENABLED) {
  console.warn("WARN: SMTP credentials incomplete. Email features may not work.");
}


const config = Object.freeze({
  
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT, 10) || 5000,
  IS_PRODUCTION: (process.env.NODE_ENV || "development") === "production",

  
  MONGODB_URI: process.env.MONGODB_URI,

  
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_EXPIRE: process.env.JWT_EXPIRE || "7d",
  JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || "30d",

  
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",

  
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",

  
  SMTP_HOST: process.env.SMTP_HOST || "smtp.gmail.com",
  SMTP_PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: (process.env.SMTP_PASS || "").replace(/\s+/g, ""),
  EMAIL_FROM: process.env.EMAIL_FROM || process.env.SMTP_USER || "",

  
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || "",
  AI_ENABLED,

  
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "",
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || "",
  STRIPE_ENABLED,

  
  OTP_EXPIRE_MINUTES: parseInt(process.env.OTP_EXPIRE, 10) || 10,

  
  SMTP_ENABLED,
});

module.exports = config;
