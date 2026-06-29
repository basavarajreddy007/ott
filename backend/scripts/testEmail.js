const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const { verifySmtpConnection, sendEmail } = require("../services/emailService");

const required = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "EMAIL_FROM"];
let missing = false;
for (const v of required) {
  if (!process.env[v]) {
    console.error(`Missing: ${v}`);
    missing = true;
  }
}
if (missing) {
  console.error("Fill in all required SMTP environment variables in backend/.env");
  process.exit(1);
}

console.log("=== SMTP Configuration ===");
console.log(`  Host: ${process.env.SMTP_HOST}`);
console.log(`  Port: ${process.env.SMTP_PORT}`);
console.log(`  User: ${process.env.SMTP_USER}`);
console.log(`  From: ${process.env.EMAIL_FROM}`);
console.log(`  Pass length: ${process.env.SMTP_PASS.trim().length} characters`);
console.log(`  Pass has spaces: ${/\s/.test(process.env.SMTP_PASS.trim())}`);
console.log("");

(async () => {
  console.log("Testing SMTP connection...");
  const verified = await verifySmtpConnection();

  if (!verified) {
    console.log("");
    console.log("=== DIAGNOSIS ===");
    if (/\s/.test(process.env.SMTP_PASS.trim())) {
      console.log("PROBLEM: SMTP_PASS contains spaces. Google App Passwords are 16 characters without spaces.");
    }
    if (process.env.SMTP_PASS.trim().length < 10) {
      console.log("PROBLEM: SMTP_PASS is too short. App Passwords are 16 characters.");
    }
    if (process.env.SMTP_PASS.trim().length > 20) {
      console.log("NOTE: SMTP_PASS is longer than expected for an App Password.");
    }
    console.log("");
    console.log("Gmail SMTP Requirements:");
    console.log("  1. Enable 2-Step Verification: https://myaccount.google.com/security");
    console.log("  2. Generate App Password:      https://myaccount.google.com/apppasswords");
    console.log("  3. Copy the 16-character password (no spaces) into SMTP_PASS");
    console.log("");
    console.log("Network Check:");
    console.log("  Run: telnet smtp.gmail.com 587");
    console.log("  If it fails, your firewall/antivirus/VPN is blocking SMTP.");
    process.exit(1);
  }

  const testTo = process.argv[2] || process.env.SMTP_USER;
  console.log(`Sending test email to: ${testTo}`);
  console.log("");

  const result = await sendEmail({
    to: testTo,
    subject: "Test Email from MOVIEMAX",
    html: "<h1>Test Email</h1><p>If you receive this, SMTP is working correctly.</p>",
  });

  if (result.success) {
    console.log("TEST PASSED: Email sent successfully!");
    console.log(`  Message ID: ${result.messageId}`);
    if (result.accepted.length) console.log(`  Accepted: ${result.accepted.join(", ")}`);
    if (result.rejected.length) console.log(`  Rejected: ${result.rejected.join(", ")}`);
  } else {
    console.log("TEST FAILED: Could not send email.");
    console.log(`  Error: ${result.error}`);
    process.exit(1);
  }
})();
