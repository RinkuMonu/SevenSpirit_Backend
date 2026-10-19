import mongoose from 'mongoose';
import Consultation from '../models/Consultation.js';
import Review from '../models/Review.js';
import { AppError, asyncHandler } from '../utils/index.js';
import { completeConsultation } from '../services/consultationService.js';

const ASTRO_FIELDS = 'name slug title profileImage onlineStatus';

/** Loads a consultation only if it belongs to the logged-in user (ownership check). */
async function loadOwned(req) {
  if (!mongoose.isValidObjectId(req.params.id)) throw new AppError('Consultation not found', 404);
  const c = await Consultation.findOne({ _id: req.params.id, user: req.user._id });
  if (!c) throw new AppError('Consultation not found', 404);
  if (c.status === 'ACTIVE' && c.expiresAt <= new Date()) await completeConsultation(c, req.app.get('io'));
  return c;
}

export const myConsultations = asyncHandler(async (req, res) => {
  const data = await Consultation.find({ user: req.user._id, status: { $ne: 'PENDING' } })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate('astrologer', ASTRO_FIELDS)
    .lean();
  res.json({ success: true, data, serverTime: new Date() });
});

export const getConsultation = asyncHandler(async (req, res) => {
  const c = await loadOwned(req);
  if (c.status === 'PENDING' || c.status === 'CANCELLED') throw new AppError('Consultation not available', 404);
  await c.populate('astrologer', ASTRO_FIELDS);
  const hasReview = !!(await Review.exists({ consultation: c._id }));
  res.json({ success: true, data: { ...c.toObject(), hasReview }, serverTime: new Date() });
});

export const endConsultation = asyncHandler(async (req, res) => {
  const c = await loadOwned(req);
  await completeConsultation(c, req.app.get('io'));
  res.json({ success: true, data: { status: c.status } });
});
