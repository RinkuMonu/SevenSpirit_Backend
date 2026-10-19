import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    astrologer: { type: mongoose.Schema.Types.ObjectId, ref: 'Astrologer', required: true, index: true },
    consultation: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultation', required: true, unique: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model('Review', reviewSchema);
