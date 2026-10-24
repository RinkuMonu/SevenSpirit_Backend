import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';
import { forgotPassword, login, me, register, resetPassword ,
  verifyEmailOTP,
  resendVerificationOTP
} from '../controllers/auth.controller.js';


const router = Router();
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again in a few minutes.' },
});
const password = body('password').isLength({ min: 8, max: 72 }).withMessage('Password must be at least 8 characters');

router.post('/register', limiter, [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2–80 characters'),
  body('email').trim().toLowerCase().isEmail().withMessage('Enter a valid email'),
  body('mobile').trim().matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10-digit mobile number'),
  password,
], validate, register);

router.post('/login', limiter, [
  body('identifier').trim().notEmpty().withMessage('Email or mobile is required'),
  body('password').notEmpty().withMessage('Password is required'),
], validate, login);

router.post('/forgot-password', limiter, [
  body('email').trim().toLowerCase().isEmail().withMessage('Enter a valid email'),
], validate, forgotPassword);

router.post('/reset-password', limiter, [
  body('token').isString().isLength({ min: 20, max: 200 }).withMessage('Invalid reset token'),
  password,
], validate, resetPassword);

router.post(
  '/verify-email-otp',
  limiter,
  [
    body('email').trim().toLowerCase().isEmail()
      .withMessage('Enter a valid email'),
    body('otp').isString().matches(/^\d{6}$/)
      .withMessage('OTP must be 6 digits'),
  ],
  validate,
  verifyEmailOTP
);

router.post(
  '/resend-email-otp',
  limiter,
  [
    body('email').trim().toLowerCase().isEmail()
      .withMessage('Enter a valid email'),
  ],
  validate,
  resendVerificationOTP
);

router.get('/me', protect, me);

export default router;
