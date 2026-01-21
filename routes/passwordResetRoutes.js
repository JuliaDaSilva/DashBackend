import express from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import User from "../models/userModel.js";
import { sendResetEmail } from "../utils/mailer.js";

const router = express.Router();

/**
 * POST /auth/forgot-password
 * Body: { email }
 */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Always return the same message (prevents email enumeration)
    const genericMsg = {
      message: "If that email exists, we sent a reset link.",
    };

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(200).json(genericMsg);
    }

    // 1) Generate raw token (sent to email)
    const rawToken = crypto.randomBytes(32).toString("hex");

    // 2) Hash token to store in DB
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    // 3) Save hash + expiry on user
    user.passwordResetTokenHash = tokenHash;
    user.passwordResetExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    // 4) Email reset link with RAW token
    const base = (process.env.FRONTEND_URL || "http://localhost:5173/#").replace(/\/+$/, ""); 
    // removes trailing slashes, so no "//reset-password"

    const resetLink = base.includes("/#")
      ? `${base}/reset-password?token=${rawToken}`      // -> http://localhost:5173/#/reset-password?token=...
      : `${base}/#/reset-password?token=${rawToken}`;   // fallback if someone sets FRONTEND_URL without /#

    await sendResetEmail(user.email, resetLink);

    return res.status(200).json(genericMsg);
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /auth/reset-password
 * Body: { token, newPassword }
 */
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ message: "Token and newPassword are required" });
    }

    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }

    // Hash token from request
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Update password (your model uses `password`)
    user.password = await bcrypt.hash(newPassword, 12);

    // Clear reset fields (single-use token)
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpiresAt = undefined;

    await user.save();

    return res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
