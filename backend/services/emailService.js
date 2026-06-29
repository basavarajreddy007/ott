const nodemailer = require("nodemailer");

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT, 10);
  const user = process.env.SMTP_USER;
  const pass = (process.env.SMTP_PASS || "").replace(/\s+/g, "");

  if (!host || !port || !user || !pass) {
    console.error("Missing SMTP configuration. Check SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env");
  }

  transporter = nodemailer.createTransport({
    host: host || "smtp.gmail.com",
    port: port || 587,
    secure: port === 465,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === "production",
    },
  });

  return transporter;
};

const verifySmtpConnection = async () => {
  try {
    const transport = getTransporter();
    await transport.verify();
    console.log("SMTP Connected - Email service ready");
    return true;
  } catch (error) {
    if (error.code === "EAUTH") {
      console.error("SMTP Authentication Failed.");
      console.error("  Cause: Invalid SMTP_USER or SMTP_PASS.");
      console.error("  Fix: If using Gmail, generate a Google App Password at:");
      console.error("  https://myaccount.google.com/apppasswords");
      console.error("  Requirements: Enable 2-Step Verification on your Google account first.");
      console.error("  The App Password is a 16-character code without spaces.");
    } else if (error.code === "ESOCKET") {
      console.error("SMTP Connection Timeout / DNS Error.");
      console.error("  Cause: Cannot reach " + process.env.SMTP_HOST + ":" + process.env.SMTP_PORT);
      console.error("  Fix: Check firewall, antivirus, VPN, or proxy settings.");
      console.error("  Try: telnet " + process.env.SMTP_HOST + " " + process.env.SMTP_PORT);
    } else if (error.code === "ECONNREFUSED") {
      console.error("SMTP Connection Refused.");
      console.error("  Cause: Server rejected the connection on port " + process.env.SMTP_PORT);
      console.error("  Fix: Gmail uses port 587 (STARTTLS) or 465 (SSL). Verify SMTP_PORT.");
    } else {
      console.error("SMTP Verification Failed:", error.message);
    }
    console.error(error.stack);
    return false;
  }
};

const sendEmail = async ({ to, subject, html }, retries = 2) => {
  const transport = getTransporter();
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const info = await transport.sendMail({
        from: `"MOVIEMAX" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
        to,
        subject,
        html,
      });

      if (info.messageId) {
        console.log(`Email sent: ${info.messageId} to ${to}`);
      }
      if (info.accepted && info.accepted.length) {
        console.log(`  Accepted: ${info.accepted.join(', ')}`);
      }
      if (info.rejected && info.rejected.length) {
        console.log(`  Rejected: ${info.rejected.join(', ')}`);
      }
      if (info.response) {
        console.log(`  SMTP Response: ${info.response}`);
      }

      return { success: true, messageId: info.messageId, accepted: info.accepted, rejected: info.rejected };
    } catch (error) {
      const isLastAttempt = attempt === retries;
      const logLevel = isLastAttempt ? console.error : console.warn;

      logLevel(`Email send attempt ${attempt + 1}/${retries + 1} failed:`);
      logLevel(`  To: ${to}, Subject: ${subject}`);
      logLevel(`  Error: ${error.message}`);
      if (isLastAttempt) {
        console.error(error.stack);
      }

      const isRetryable = error.code === "ETIMEOUT" || error.code === "ESOCKET" || error.code === "ECONNREFUSED";
      if (isLastAttempt || !isRetryable) {
        return { success: false, error: error.message, code: error.code, command: error.command };
      }

      const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  return { success: false, error: "Exhausted all retry attempts" };
};

const sendOtpEmail = async (email, otp) => {
  const subject = "Your OTP for Email Verification";
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { margin:0; padding:0; background:#0B0B0B; font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif; }
  .container { max-width:600px; margin:0 auto; padding:40px 20px; }
  .header { text-align:center; padding:30px 0; }
  .logo { font-size:32px; font-weight:700; color:#E50914; letter-spacing:2px; }
  .content { background:linear-gradient(135deg,#1F1F1F,#2A2A2A); border-radius:16px; padding:40px; text-align:center; }
  .otp-title { color:#FFFFFF; font-size:24px; margin-bottom:20px; }
  .otp-code { display:inline-block; background:#0B0B0B; color:#FFD54F; font-size:48px; font-weight:700; letter-spacing:12px; padding:20px 40px; border-radius:12px; margin:20px 0; }
  .otp-desc { color:#B3B3B3; font-size:14px; line-height:1.6; margin-top:20px; }
  .footer { text-align:center; padding:30px 0; color:#666; font-size:12px; }
  .highlight { color:#E50914; }
</style></head>
<body>
<div class="container">
  <div class="header"><div class="logo">MOVIEMAX</div></div>
  <div class="content">
    <div class="otp-title">Email Verification</div>
    <p style="color:#B3B3B3;margin-bottom:30px;">Use the following OTP to verify your email address</p>
    <div class="otp-code">${otp}</div>
    <p class="otp-desc">This OTP is valid for <span class="highlight">10 minutes</span>. Do not share this code with anyone.</p>
    <p style="color:#666;font-size:12px;margin-top:30px;">If you didn't request this, please ignore this email.</p>
  </div>
  <div class="footer"><p>&copy; 2026 MOVIEMAX. All rights reserved.</p></div>
</div>
</body>
</html>`;
  return sendEmail({ to: email, subject, html });
};

const sendWelcomeEmail = async (email, name) => {
  const baseUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const subject = "Welcome to MOVIEMAX!";
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { margin:0; padding:0; background:#0B0B0B; font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif; }
  .container { max-width:600px; margin:0 auto; padding:40px 20px; }
  .header { text-align:center; padding:30px 0; }
  .logo { font-size:32px; font-weight:700; color:#E50914; letter-spacing:2px; }
  .content { background:linear-gradient(135deg,#1F1F1F,#2A2A2A); border-radius:16px; padding:40px; text-align:center; }
  .welcome-title { color:#FFFFFF; font-size:28px; margin-bottom:15px; }
  .welcome-text { color:#B3B3B3; font-size:16px; line-height:1.8; margin-bottom:30px; }
  .btn { display:inline-block; background:#E50914; color:#FFFFFF; text-decoration:none; padding:15px 40px; border-radius:8px; font-size:16px; font-weight:600; }
  .footer { text-align:center; padding:30px 0; color:#666; font-size:12px; }
</style></head>
<body>
<div class="container">
  <div class="header"><div class="logo">MOVIEMAX</div></div>
  <div class="content">
    <div class="welcome-title">Welcome, ${name}!</div>
    <div class="welcome-text">Your account has been created successfully. Start exploring thousands of movies, TV shows, and web series in stunning quality.</div>
    <a href="${baseUrl}/browse" class="btn">Start Watching</a>
  </div>
  <div class="footer"><p>&copy; 2026 MOVIEMAX. All rights reserved.</p></div>
</div>
</body>
</html>`;
  return sendEmail({ to: email, subject, html });
};

const sendPasswordResetOtp = async (email, otp) => {
  const subject = "Password Reset OTP";
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { margin:0; padding:0; background:#0B0B0B; font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif; }
  .container { max-width:600px; margin:0 auto; padding:40px 20px; }
  .header { text-align:center; padding:30px 0; }
  .logo { font-size:32px; font-weight:700; color:#E50914; letter-spacing:2px; }
  .content { background:linear-gradient(135deg,#1F1F1F,#2A2A2A); border-radius:16px; padding:40px; text-align:center; }
  .title { color:#FFFFFF; font-size:24px; margin-bottom:20px; }
  .otp-code { display:inline-block; background:#0B0B0B; color:#FFD54F; font-size:48px; font-weight:700; letter-spacing:12px; padding:20px 40px; border-radius:12px; margin:20px 0; }
  .desc { color:#B3B3B3; font-size:14px; line-height:1.6; margin-top:20px; }
  .footer { text-align:center; padding:30px 0; color:#666; font-size:12px; }
  .highlight { color:#E50914; }
</style></head>
<body>
<div class="container">
  <div class="header"><div class="logo">MOVIEMAX</div></div>
  <div class="content">
    <div class="title">Password Reset Request</div>
    <p style="color:#B3B3B3;margin-bottom:30px;">Use the following OTP to reset your password</p>
    <div class="otp-code">${otp}</div>
    <p class="desc">This OTP is valid for <span class="highlight">10 minutes</span>. If you didn't request this, please ignore this email.</p>
  </div>
  <div class="footer"><p>&copy; 2026 MOVIEMAX. All rights reserved.</p></div>
</div>
</body>
</html>`;
  return sendEmail({ to: email, subject, html });
};

const sendSubscriptionConfirmation = async (email, planName, amount) => {
  const baseUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const subject = "Subscription Confirmed!";
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { margin:0; padding:0; background:#0B0B0B; font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif; }
  .container { max-width:600px; margin:0 auto; padding:40px 20px; }
  .header { text-align:center; padding:30px 0; }
  .logo { font-size:32px; font-weight:700; color:#E50914; letter-spacing:2px; }
  .content { background:linear-gradient(135deg,#1F1F1F,#2A2A2A); border-radius:16px; padding:40px; text-align:center; }
  .success-icon { font-size:64px; margin-bottom:20px; }
  .title { color:#FFFFFF; font-size:24px; margin-bottom:15px; }
  .plan-name { display:inline-block; background:#E50914; color:#FFFFFF; font-size:20px; font-weight:700; padding:10px 30px; border-radius:8px; margin:20px 0; }
  .detail { color:#B3B3B3; font-size:16px; margin:10px 0; }
  .btn { display:inline-block; background:#E50914; color:#FFFFFF; text-decoration:none; padding:15px 40px; border-radius:8px; font-size:16px; font-weight:600; margin-top:20px; }
  .footer { text-align:center; padding:30px 0; color:#666; font-size:12px; }
</style></head>
<body>
<div class="container">
  <div class="header"><div class="logo">MOVIEMAX</div></div>
  <div class="content">
    <div class="success-icon">&#10004;</div>
    <div class="title">Subscription Confirmed!</div>
    <div class="plan-name">${planName}</div>
    <div class="detail">Amount: $${amount}</div>
    <p style="color:#B3B3B3;">Thank you for subscribing! Enjoy unlimited access to premium content.</p>
    <a href="${baseUrl}/watch" class="btn">Start Watching</a>
  </div>
  <div class="footer"><p>&copy; 2026 MOVIEMAX. All rights reserved.</p></div>
</div>
</body>
</html>`;
  return sendEmail({ to: email, subject, html });
};

module.exports = {
  sendOtpEmail,
  sendWelcomeEmail,
  sendPasswordResetOtp,
  sendSubscriptionConfirmation,
  verifySmtpConnection,
  getTransporter,
  sendEmail,
};
