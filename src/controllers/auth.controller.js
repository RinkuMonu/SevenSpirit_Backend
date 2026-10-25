import crypto from "crypto";
import User from "../models/User.js";
import { env } from "../config/env.js";
import { AppError, asyncHandler, signToken } from "../utils/index.js";
import { sendMail } from "../utils/mailer.js";

import { sendVerificationOTP } from "../utils/email.js";

const sendAuth = (res, user, status = 200) =>
  res
    .status(status)
    .json({ success: true, token: signToken(user._id), user: user.toPublic() });

const hash = (t) => crypto.createHash("sha256").update(t).digest("hex");

export const register = asyncHandler(async (req, res) => {
  const { name, email, mobile, password } = req.body;
  const exists = await User.findOne({ $or: [{ email }, { mobile }] });
  if (exists)
    throw new AppError(
      "An account with this email or mobile already exists",
      409,
    );
  const user = await User.create({ name, email, mobile, password });
  sendAuth(res, user, 201);
});

export const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;
  const query = identifier.includes("@")
    ? { email: identifier.toLowerCase() }
    : { mobile: identifier };
  const user = await User.findOne(query).select("+password");
  // Same message for unknown user / wrong password avoids account enumeration.
  if (!user || !(await user.comparePassword(password)))
    throw new AppError("Invalid credentials", 401);
  sendAuth(res, user);
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toPublic() });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = hash(token);
    user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000);
    await user.save({ validateBeforeSave: false });
    const link = `${env.siteUrl}/reset-password?token=${token}`;
    await sendMail({
      to: user.email,
      subject: "Reset your AstroConnect password",
      text: `Reset your password using this link (valid for 30 minutes): ${link}`,
      html: `<p>Reset your password using the link below (valid for 30 minutes).</p><p><a href="${link}">Reset password</a></p>`,
    });
  }
  res.json({
    success: true,
    message: "If an account exists for this email, a reset link has been sent.",
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: hash(req.body.token),
    resetPasswordExpires: { $gt: new Date() },
  }).select("+resetPasswordToken +resetPasswordExpires");
  if (!user) throw new AppError("Reset link is invalid or has expired", 400);
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  sendAuth(res, user);
});

const generateOTP = () => crypto.randomInt(100000, 1000000).toString();

const hashOTP = (otp) => crypto.createHash("sha256").update(otp).digest("hex");

const otpExpiryMs = Number(process.env.OTP_EXPIRES_MINUTES || 10) * 60 * 1000;

const resendCooldownMs = 60 * 1000;
const maxOtpAttempts = 5;

// export const verifyEmailOTP = async (req, res, next) => {
//   try {
//     const email = String(req.body.email || '')
//       .trim()
//       .toLowerCase();

//     const otp = String(req.body.otp || '');

//     if (!/^\d{6}$/.test(otp)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Enter a valid 6-digit OTP.',
//       });
//     }

//     const user = await User.findOne({ email })
//       .select(
//         '+emailVerificationOtpHash ' +
//         '+emailVerificationOtpExpiresAt ' +
//         '+emailVerificationOtpAttempts'
//       );

//     if (!user) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid email or OTP.',
//       });
//     }

//     if (user.emailVerified) {
//       return res.status(200).json({
//         success: true,
//         message: 'Email is already verified.',
//       });
//     }

//     if (
//       !user.emailVerificationOtpHash ||
//       !user.emailVerificationOtpExpiresAt ||
//       user.emailVerificationOtpExpiresAt <= new Date()
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: 'OTP has expired. Please request a new OTP.',
//       });
//     }

//     if (
//       (user.emailVerificationOtpAttempts || 0) >= maxOtpAttempts
//     ) {
//       return res.status(429).json({
//         success: false,
//         message: 'Too many incorrect attempts. Request a new OTP.',
//       });
//     }

//     user.emailVerificationOtpAttempts =
//       (user.emailVerificationOtpAttempts || 0) + 1;

//     if (hashOTP(otp) !== user.emailVerificationOtpHash) {
//       await user.save();

//       return res.status(400).json({
//         success: false,
//         message: 'Invalid email or OTP.',
//       });
//     }

//     user.emailVerified = true;
//     user.emailVerificationOtpHash = null;
//     user.emailVerificationOtpExpiresAt = null;
//     user.emailVerificationOtpAttempts = 0;

//     await user.save();

//     return res.status(200).json({
//       success: true,
//       message: 'Email verified successfully.',
//     });
//   } catch (error) {
//     next(error);
//   }
// };


export const verifyEmailOTP = async (req, res, next) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();

    const otp = String(req.body.otp || "").trim();

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 6-digit OTP.",
      });
    }

    const user = await User.findOne({ email }).select(
      "+emailVerificationOtpHash " +
      "+emailVerificationOtpExpiresAt " +
      "+emailVerificationOtpAttempts"
    );

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or OTP.",
      });
    }

    if (
      !user.emailVerificationOtpHash ||
      !user.emailVerificationOtpExpiresAt ||
      user.emailVerificationOtpExpiresAt <= new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new OTP.",
      });
    }

    if (
      (user.emailVerificationOtpAttempts || 0) >= maxOtpAttempts
    ) {
      return res.status(429).json({
        success: false,
        message: "Too many incorrect attempts. Request a new OTP.",
      });
    }

    user.emailVerificationOtpAttempts =
      (user.emailVerificationOtpAttempts || 0) + 1;

    if (hashOTP(otp) !== user.emailVerificationOtpHash) {
      await user.save();

      return res.status(400).json({
        success: false,
        message: "Invalid email or OTP.",
      });
    }

    // Successful OTP: verify email and clear the one-time code.
    user.emailVerified = true;
    user.emailVerificationOtpHash = null;
    user.emailVerificationOtpExpiresAt = null;
    user.emailVerificationOtpAttempts = 0;

    await user.save();

    // Return the login token for both new and existing users.
    return res.status(200).json({
      success: true,
      message: "OTP verified and login successful.",
      token: signToken(user._id),
      user: user.toPublic(),
    });
  } catch (error) {
    next(error);
  }
};

export const resendVerificationOTP = async (req, res, next) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();

    const user = await User.findOne({ email }).select(
      "+emailVerificationOtpHash " +
      "+emailVerificationOtpExpiresAt " +
      "+emailVerificationOtpAttempts " +
      "+emailVerificationLastSentAt"
    );

    // Do not reveal whether the account exists.
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If an account exists, an OTP will be sent.",
      });
    }

    const now = Date.now();
    const lastSent =
      user.emailVerificationLastSentAt?.getTime() || 0;

    if (now - lastSent < resendCooldownMs) {
      return res.status(429).json({
        success: false,
        message: "Please wait 60 seconds before requesting another OTP.",
      });
    }

    const otp = generateOTP();

    user.emailVerificationOtpHash = hashOTP(otp);
    user.emailVerificationOtpExpiresAt =
      new Date(now + otpExpiryMs);
    user.emailVerificationOtpAttempts = 0;
    user.emailVerificationLastSentAt = new Date(now);

    await user.save();

    try {
      await sendVerificationOTP(user.email, otp);
    } catch (error) {
      user.emailVerificationOtpHash = null;
      user.emailVerificationOtpExpiresAt = null;
      await user.save();
      throw error;
    }

    return res.status(200).json({
      success: true,
      message: "If an account exists, an OTP will be sent.",
    });
  } catch (error) {
    next(error);
  }
};


// export const resendVerificationOTP = async (req, res, next) => {
//   try {
//     const email = String(req.body.email || "")
//       .trim()
//       .toLowerCase();

//     const user = await User.findOne({ email }).select(
//       "+emailVerificationOtpHash " +
//         "+emailVerificationOtpExpiresAt " +
//         "+emailVerificationOtpAttempts " +
//         "+emailVerificationLastSentAt",
//     );

//     // Avoid revealing whether an account exists.
//     if (!user || user.emailVerified) {
//       return res.status(200).json({
//         success: true,
//         message:
//           "If the account needs verification, instructions will be sent.",
//       });
//     }

//     const now = Date.now();
//     const lastSent = user.emailVerificationLastSentAt?.getTime() || 0;

//     if (now - lastSent < resendCooldownMs) {
//       return res.status(429).json({
//         success: false,
//         message: "Please wait 60 seconds before requesting another OTP.",
//       });
//     }

//     const otp = generateOTP();

//     user.emailVerificationOtpHash = hashOTP(otp);
//     user.emailVerificationOtpExpiresAt = new Date(now + otpExpiryMs);
//     user.emailVerificationOtpAttempts = 0;
//     user.emailVerificationLastSentAt = new Date(now);

//     await user.save();

//     try {
//       await sendVerificationOTP(user.email, otp);
//     } catch (error) {
//       user.emailVerificationOtpHash = null;
//       user.emailVerificationOtpExpiresAt = null;
//       await user.save();
//       throw error;
//     }

//     return res.status(200).json({
//       success: true,
//       message: "If the account needs verification, instructions will be sent.",
//     });
//   } catch (error) {
//     next(error);
//   }
// };
