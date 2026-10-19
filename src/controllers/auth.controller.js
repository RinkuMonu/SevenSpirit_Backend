import crypto from 'crypto';
import User from '../models/User.js';
import { env } from '../config/env.js';
import { AppError, asyncHandler, signToken } from '../utils/index.js';
import { sendMail } from '../utils/mailer.js';

const sendAuth = (res, user, status = 200) =>
  res.status(status).json({ success: true, token: signToken(user._id), user: user.toPublic() });

const hash = (t) => crypto.createHash('sha256').update(t).digest('hex');

export const register = asyncHandler(async (req, res) => {
  const { name, email, mobile, password } = req.body;
  const exists = await User.findOne({ $or: [{ email }, { mobile }] });
  if (exists) throw new AppError('An account with this email or mobile already exists', 409);
  const user = await User.create({ name, email, mobile, password });
  sendAuth(res, user, 201);
});

export const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;
  const query = identifier.includes('@') ? { email: identifier.toLowerCase() } : { mobile: identifier };
  const user = await User.findOne(query).select('+password');
  // Same message for unknown user / wrong password avoids account enumeration.
  if (!user || !(await user.comparePassword(password))) throw new AppError('Invalid credentials', 401);
  sendAuth(res, user);
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toPublic() });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = hash(token);
    user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000);
    await user.save({ validateBeforeSave: false });
    const link = `${env.siteUrl}/reset-password?token=${token}`;
    await sendMail({
      to: user.email,
      subject: 'Reset your AstroConnect password',
      text: `Reset your password using this link (valid for 30 minutes): ${link}`,
      html: `<p>Reset your password using the link below (valid for 30 minutes).</p><p><a href="${link}">Reset password</a></p>`,
    });
  }
  res.json({ success: true, message: 'If an account exists for this email, a reset link has been sent.' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: hash(req.body.token),
    resetPasswordExpires: { $gt: new Date() },
  }).select('+resetPasswordToken +resetPasswordExpires');
  if (!user) throw new AppError('Reset link is invalid or has expired', 400);
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  sendAuth(res, user);
});
