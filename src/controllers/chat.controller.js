import crypto from 'crypto';
import mongoose from 'mongoose';
import Consultation from '../models/Consultation.js';
import Message from '../models/Message.js';
import { env } from '../config/env.js';
import { AppError, asyncHandler } from '../utils/index.js';
import { serializeMessage, postMessage } from '../services/chatService.js';

export const getMessages = asyncHandler(async (req, res) => {
  const { consultationId } = req.params;
  if (!mongoose.isValidObjectId(consultationId)) throw new AppError('Consultation not found', 404);
  const c = await Consultation.findOne({ _id: consultationId, user: req.user._id, type: 'CHAT' });
  if (!c || !['ACTIVE', 'COMPLETED'].includes(c.status)) throw new AppError('Consultation not found', 404);
  const messages = await Message.find({ consultation: c._id }).sort({ createdAt: 1 }).limit(500);
  res.json({ success: true, data: messages.map(serializeMessage) });
});

/**
 * There is no astrologer panel. Whatever tool you use on the astrologer side
 * (script, Postman, your own private client) can reply through this endpoint,
 * authenticated with ASTROLOGER_API_KEY.
 */
export const astrologerReply = asyncHandler(async (req, res) => {
  if (!env.astrologerApiKey) throw new AppError('Astrologer replies are disabled', 503);
  const given = Buffer.from(String(req.headers['x-astrologer-key'] || ''));
  const real = Buffer.from(env.astrologerApiKey);
  if (given.length !== real.length || !crypto.timingSafeEqual(given, real)) throw new AppError('Forbidden', 403);

  const c = await Consultation.findOne({ _id: req.params.consultationId, type: 'CHAT' });
  if (!c || c.status !== 'ACTIVE' || c.expiresAt <= new Date()) throw new AppError('Consultation is not active', 409);
  const msg = await postMessage(req.app.get('io'), c, 'ASTROLOGER', req.body.message);
  res.status(201).json({ success: true, data: serializeMessage(msg) });
});
