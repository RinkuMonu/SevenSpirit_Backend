import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    consultation: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultation', required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, refPath: 'senderModel', required: true },
    senderModel: { type: String, enum: ['User', 'Astrologer'], required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, required: true },
    message: { type: String, required: true, maxlength: 1000 },
    messageType: { type: String, enum: ['TEXT', 'SYSTEM'], default: 'TEXT' },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model('Message', messageSchema);
