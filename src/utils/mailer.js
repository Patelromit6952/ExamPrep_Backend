import { BrevoClient } from "@getbrevo/brevo";
import dotenv from "dotenv";

dotenv.config();

const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY
});

/**
 * Sends a 6-digit OTP email using Brevo.
 */
export const sendOtpEmail = async (to, otp) => {
  const expiryMinutes = Number(process.env.OTP_EXPIRY_MINUTES) || 10;

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="
        margin: 0;
        padding: 0;
        background: #f8fafc;
        font-family: Arial, Helvetica, sans-serif;
      ">

        <div style="
          max-width: 480px;
          margin: 40px auto;
          background: #ffffff;
          padding: 32px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        ">

          <h2 style="
            color: #1f3a61;
            margin: 0 0 12px;
          ">
            ExamPrep
          </h2>

          <p style="
            color: #334155;
            font-size: 14px;
          ">
            Use the verification code below to verify your email address.
          </p>

          <div style="
            margin: 28px 0;
            text-align: center;
          ">
            <span style="
              display: inline-block;
              padding: 16px 24px;
              background: #f1f5f9;
              border-radius: 8px;
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 8px;
              color: #1f3a61;
            ">
              ${otp}
            </span>
          </div>

          <p style="
            color: #64748b;
            font-size: 13px;
          ">
            This code expires in ${expiryMinutes} minutes.
          </p>

          <p style="
            color: #64748b;
            font-size: 13px;
          ">
            If you didn't request this verification code,
            you can safely ignore this email.
          </p>

          <hr style="
            border: none;
            border-top: 1px solid #e2e8f0;
            margin: 24px 0;
          ">

          <p style="
            color: #94a3b8;
            font-size: 12px;
            text-align: center;
          ">
            © ${new Date().getFullYear()} ExamPrep
          </p>

        </div>

      </body>
    </html>
  `;

  try {
    const result = await brevo.transactionalEmails.sendTransacEmail({
      sender: {
        name: process.env.BREVO_SENDER_NAME,
        email: process.env.BREVO_SENDER_EMAIL
      },

      to: [
        {
          email: to
        }
      ],

      subject: "Your ExamPrep verification code",

      htmlContent: html
    });

    console.log(`OTP email sent successfully to ${to}`, result.messageId);

    return result;
  } catch (error) {
    console.error("Brevo email error:", error);
    throw new Error("Failed to send OTP email");
  }
};
