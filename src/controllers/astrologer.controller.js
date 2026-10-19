import Astrologer from '../models/Astrologer.js';
import { AppError, asyncHandler, escapeRegex } from '../utils/index.js';

const PRICE_BANDS = {
  'under-199': [0, 198],
  '199-499': [199, 499],
  '500-999': [500, 999],
  '1000-plus': [1000, Number.MAX_SAFE_INTEGER],
};
const SORTS = {
  recommended: { rating: -1, totalConsultations: -1 },
  rating: { rating: -1, reviewCount: -1 },
  experience: { experience: -1 },
  popular: { totalConsultations: -1 },
  'price-asc': { chatPrice10Min: 1 },
  'price-desc': { chatPrice10Min: -1 },
};
const exactCI = (csv) => String(csv).split(',').map((s) => new RegExp(`^${escapeRegex(s.trim())}$`, 'i'));

export const listAstrologers = asyncHandler(async (req, res) => {
  const { q, specialization, language, experience, price, rating, status, sort = 'recommended' } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(48, Math.max(1, parseInt(req.query.limit, 10) || 12));

  const filter = { isActive: true };
  if (q) {
    const rx = new RegExp(escapeRegex(String(q).trim().slice(0, 60)), 'i');
    filter.$or = [{ name: rx }, { specialization: rx }, { languages: rx }];
  }
  if (specialization) filter.specialization = { $in: exactCI(specialization) };
  if (language) filter.languages = { $in: exactCI(language) };
  if (Number(experience) > 0) filter.experience = { $gte: Number(experience) };
  if (Number(rating) > 0) filter.rating = { $gte: Number(rating) };
  if (status === 'online') filter.onlineStatus = 'ONLINE';
  if (status === 'offline') filter.onlineStatus = 'OFFLINE';
  if (PRICE_BANDS[price]) {
    const [min, max] = PRICE_BANDS[price];
    const starting = { $min: ['$chatPrice10Min', '$callPrice10Min'] };
    filter.$expr = { $and: [{ $gte: [starting, min] }, { $lte: [starting, max] }] };
  }

  const [data, total] = await Promise.all([
    Astrologer.find(filter)
      .sort(SORTS[sort] || SORTS.recommended)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Astrologer.countDocuments(filter),
  ]);
  res.json({ success: true, data, total, page, pages: Math.ceil(total / limit) });
});

export const featuredAstrologers = asyncHandler(async (req, res) => {
  const data = await Astrologer.find({ isActive: true, isVerified: true })
    .sort({ rating: -1, totalConsultations: -1 })
    .limit(6)
    .lean();
  res.json({ success: true, data });
});

export const getAstrologer = asyncHandler(async (req, res) => {
  const data = await Astrologer.findOne({ slug: req.params.slug, isActive: true }).lean();
  if (!data) throw new AppError('Astrologer not found', 404);
  res.json({ success: true, data });
});
