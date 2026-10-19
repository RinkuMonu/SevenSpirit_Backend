import mongoose from 'mongoose';

const consultationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    astrologer: { type: mongoose.Schema.Types.ObjectId, ref: 'Astrologer', required: true },
    type: { type: String, enum: ['CHAT', 'CALL'], required: true },
    duration: { type: Number, enum: [10, 30, 60], required: true },
    amount: { type: Number, required: true },
    paymentId: String,
    orderId: { type: String, index: true },
    status: {
      type: String,
      enum: ['PENDING', 'ACTIVE', 'COMPLETED', 'EXPIRED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    startTime: Date,
    endTime: Date,
    expiresAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model('Consultation', consultationSchema);
