import nodemailer from "nodemailer";

/**
 * Send password reset email
 * @param {string} to - recipient email
 * @param {string} resetLink - reset URL with token
 */
export async function sendResetEmail(to, resetLink) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Gmail App Password
    },
  });

  const text =
    `Hi,\n\n` +
    `We received a request to reset your ElleHacks password.\n\n` +
    `Reset your password using this link (expires in 15 minutes):\n` +
    `${resetLink}\n\n` +
    `If you didn’t request this, you can ignore this email.\n\n` +
    `— ElleHacks Team\n`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: "Reset your ElleHacks password",
    text,
  });
}
