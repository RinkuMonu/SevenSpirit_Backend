import Astrologer from '../models/Astrologer.js';
import Consultation from '../models/Consultation.js';
import Review from '../models/Review.js';
import { AppError, asyncHandler } from '../utils/index.js';

export const createReview = asyncHandler(async (req, res) => {
  const { consultationId, rating, review } = req.body;
  const c = await Consultation.findOne({ _id: consultationId, user: req.user._id });
  if (!c) throw new AppError('Consultation not found', 404);
  if (c.status !== 'COMPLETED') throw new AppError('You can review only after the consultation is completed', 400);
  if (await Review.exists({ consultation: c._id })) throw new AppError('You have already reviewed this consultation', 409);

  const doc = await Review.create({ user: req.user._id, astrologer: c.astrologer, consultation: c._id, rating, review });

  // Blend the new rating into the astrologer's running average.
  const a = await Astrologer.findById(c.astrologer);
  const count = a.reviewCount + 1;
  a.rating = Math.round(((a.rating * a.reviewCount + rating) / count) * 10) / 10;
  a.reviewCount = count;
  await a.save();

  res.status(201).json({ success: true, data: doc });
});

export const astrologerReviews = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = 10;
  const [items, total] = await Promise.all([
    Review.find({ astrologer: req.params.astrologerId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', 'name')
      .lean(),
    Review.countDocuments({ astrologer: req.params.astrologerId }),
  ]);
  const data = items.map((r) => ({
    _id: r._id, rating: r.rating, review: r.review, createdAt: r.createdAt, userName: r.user?.name || 'Customer',
  }));
  res.json({ success: true, data, total, page, pages: Math.ceil(total / limit) });
});
