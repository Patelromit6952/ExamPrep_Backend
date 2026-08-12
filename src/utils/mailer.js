import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

let transporter = null;

/**
 * Lazily creates a single reusable Nodemailer transport using Gmail SMTP.
 * Requires a Gmail account with 2-Step Verification enabled and an
 * "App Password" (NOT the regular account password) - see README.
 */
const getTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });

  return transporter;
};

/** Sends a 6-digit OTP code to the given email address. */
export const sendOtpEmail = async (to, otp) => {
  const expiryMinutes = Number(process.env.OTP_EXPIRY_MINUTES) || 10;

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color:#1f3a61; margin-bottom: 4px;">ExamPrep</h2>
      <p style="color:#334155; font-size: 14px;">Use the code below to verify your email address:</p>
      <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color:#1f3a61; margin: 20px 0;">
        ${otp}
      </p>
      <p style="color:#64748b; font-size: 13px;">
        This code expires in ${expiryMinutes} minutes. If you didn't request this, you can safely ignore this email.
      </p>
    </div>
  `;

  await getTransporter().sendMail({
    from: `"ExamPrep" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Your ExamPrep verification code",
    html
  });
};
