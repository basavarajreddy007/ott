const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

exports.sendOtpEmail = (to, otp) =>
    transporter.sendMail({
        from: `"Neostream" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Neostream Login Code',
        html: `<h3>Welcome to Neostream</h3><p>Your one-time login code is: <strong>${otp}</strong></p><p>It will expire in 10 minutes.</p>`
    });
