import mongoose from 'mongoose';
import { slugify } from '../utils/index.js';

const price = { type: Number, required: true, min: 1 };

const astrologerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    title: { type: String, trim: true }, // e.g. "Love & Relationship Expert"
    profileImage: String,
    coverImage: String,
    gallery: [String],
    bio: { type: String, required: true },
    experience: { type: Number, required: true, min: 0 },
    specialization: [{ type: String, trim: true }],
    languages: [{ type: String, trim: true }],
    gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'], default: 'MALE' },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    totalConsultations: { type: Number, default: 0 },
    chatPrice10Min: price,
    chatPrice30Min: price,
    chatPrice60Min: price,
    callPrice10Min: price,
    callPrice30Min: price,
    callPrice60Min: price,
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    onlineStatus: { type: String, enum: ['ONLINE', 'BUSY', 'OFFLINE'], default: 'OFFLINE' },
  },
  { timestamps: true }
);

astrologerSchema.index({ isActive: 1, rating: -1 });

astrologerSchema.pre('validate', function () {
  if (!this.slug && this.name) this.slug = slugify(this.name);
});

astrologerSchema.methods.priceFor = function (type, duration) {
  return this[`${String(type).toLowerCase()}Price${duration}Min`];
};

export default mongoose.model('Astrologer', astrologerSchema);
