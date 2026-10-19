import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    astrologer: { type: mongoose.Schema.Types.ObjectId, ref: 'Astrologer', required: true },
    consultation: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultation', required: true },
    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: String,
    amount: { type: Number, required: true }, // in rupees
    status: { type: String, enum: ['CREATED', 'SUCCESS', 'FAILED'], default: 'CREATED' },
  },
  { timestamps: true }
);

export default mongoose.model('Payment', paymentSchema);
