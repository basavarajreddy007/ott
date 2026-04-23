const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

exports.sendOtpEmail = (to, otp) =>
    transporter.sendMail({
        from: `"Streamer" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Your Login Code',
        html: `<p>Your one-time login code is: <strong>${otp}</strong></p><p>Expires in 10 minutes.</p>`
    });
