import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendVerificationOTP = async (email, otp) => {
  return transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'Verify Your Email Address',
    text: `Your email verification OTP is ${otp}. It expires in ${
      process.env.OTP_EXPIRES_MINUTES || 10
    } minutes. Do not share this OTP with anyone.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:24px">
        <h2>Email Verification</h2>
        <p>Use the OTP below to verify your email address.</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:8px;
                    padding:16px;background:#f3f4f6;text-align:center">
          ${otp}
        </div>
        <p>This OTP expires in ${
          process.env.OTP_EXPIRES_MINUTES || 10
        } minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `,
  });
};

export default transporter;