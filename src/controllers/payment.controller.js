import crypto from 'crypto';
import Astrologer from '../models/Astrologer.js';
import Consultation from '../models/Consultation.js';
import Payment from '../models/Payment.js';
import { env } from '../config/env.js';
import { getRazorpay } from '../config/razorpay.js';
import { AppError, asyncHandler } from '../utils/index.js';

/**
 * Step 1 — the client only says WHO / WHAT / HOW LONG.
 * The amount is always read from the database, never from the client.
 */
export const createOrder = asyncHandler(async (req, res) => {
  const { astrologerId, type, duration } = req.body;
  const astrologer = await Astrologer.findOne({ _id: astrologerId, isActive: true });
  if (!astrologer) throw new AppError('Astrologer not found', 404);
  if (astrologer.onlineStatus !== 'ONLINE') {
    throw new AppError(`${astrologer.name} is currently ${astrologer.onlineStatus.toLowerCase()}. Please try again later.`, 409);
  }
  const amount = astrologer.priceFor(type, duration);
  if (!amount) throw new AppError('Invalid consultation plan', 400);

  const order = await getRazorpay().orders.create({
    amount: Math.round(amount * 100),
    currency: 'INR',
    receipt: `c_${Date.now()}_${String(req.user._id).slice(-6)}`,
    notes: { astrologer: astrologer.slug, type, duration: String(duration), user: String(req.user._id) },
  });

  const consultation = await Consultation.create({
    user: req.user._id, astrologer: astrologer._id, type, duration, amount, orderId: order.id, status: 'PENDING',
  });
  await Payment.create({
    user: req.user._id, astrologer: astrologer._id, consultation: consultation._id,
    razorpayOrderId: order.id, amount, status: 'CREATED',
  });

  res.status(201).json({
    success: true,
    data: { orderId: order.id, amount: order.amount, currency: order.currency, keyId: env.razorpayKeyId },
  });
});

/**
 * Step 2 — never trust the browser. Only a valid HMAC signature (and a matching
 * payment fetched from Razorpay) can activate a consultation.
 */
export const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body;

  const payment = await Payment.findOne({ razorpayOrderId: orderId, user: req.user._id });
  if (!payment) throw new AppError('Order not found', 404);

  const done = async () => {
    const c = await Consultation.findById(payment.consultation);
    return res.json({ success: true, data: { consultationId: c._id, type: c.type } });
  };
  if (payment.status === 'SUCCESS') return done(); // idempotent

  const expected = crypto.createHmac('sha256', env.razorpayKeySecret).update(`${orderId}|${paymentId}`).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    await Payment.updateOne({ _id: payment._id, status: 'CREATED' }, { status: 'FAILED' });
    await Consultation.updateOne({ _id: payment.consultation, status: 'PENDING' }, { status: 'CANCELLED' });
    throw new AppError('Payment verification failed', 400);
  }

  // Defence in depth: confirm with Razorpay that this payment belongs to this order and amount.
  const rp = await getRazorpay().payments.fetch(paymentId);
  if (rp.order_id !== orderId || rp.amount !== Math.round(payment.amount * 100) || !['captured', 'authorized'].includes(rp.status)) {
    throw new AppError('Payment details do not match the order', 400);
  }

  // Atomic CREATED -> SUCCESS so concurrent verify calls activate only once.
  const claimed = await Payment.findOneAndUpdate(
    { _id: payment._id, status: 'CREATED' },
    { status: 'SUCCESS', razorpayPaymentId: paymentId },
    { new: true }
  );
  if (!claimed) return done();

  const now = new Date();
  const consultation = await Consultation.findOne({ _id: payment.consultation });
  const expiresAt = new Date(now.getTime() + consultation.duration * 60 * 1000);
  await Consultation.updateOne(
    { _id: consultation._id, status: { $in: ['PENDING', 'EXPIRED'] } },
    { status: 'ACTIVE', paymentId, startTime: now, endTime: expiresAt, expiresAt }
  );
  await Astrologer.updateOne({ _id: payment.astrologer }, { $inc: { totalConsultations: 1 } });

  return done();
});
