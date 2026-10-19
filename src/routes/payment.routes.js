import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { body } from 'express-validator';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createOrder, verifyPayment } from '../controllers/payment.controller.js';

const router = Router();
router.use(protect, rateLimit({ windowMs: 10 * 60 * 1000, limit: 40, standardHeaders: true, legacyHeaders: false }));

router.post('/order', [
  body('astrologerId').isMongoId().withMessage('Invalid astrologer'),
  body('type').isIn(['CHAT', 'CALL']).withMessage('Type must be CHAT or CALL'),
  body('duration').toInt().isIn([10, 30, 60]).withMessage('Duration must be 10, 30 or 60 minutes'),
], validate, createOrder);

router.post('/verify', [
  body('razorpay_order_id').isString().notEmpty(),
  body('razorpay_payment_id').isString().notEmpty(),
  body('razorpay_signature').isString().notEmpty(),
], validate, verifyPayment);

export default router;
