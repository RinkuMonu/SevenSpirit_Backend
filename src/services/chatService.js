import Consultation from '../models/Consultation.js';
import Message from '../models/Message.js';
import { env } from '../config/env.js';
import { roomName } from './consultationService.js';

export const serializeMessage = (m) => ({
  _id: m._id,
  consultation: m.consultation,
  senderModel: m.senderModel,
  message: m.message,
  messageType: m.messageType,
  isRead: m.isRead,
  createdAt: m.createdAt,
});

/** Persists a message and broadcasts it to the consultation room. */
export async function postMessage(io, consultation, from, text) {
  const fromUser = from === 'USER';
  const msg = await Message.create({
    consultation: consultation._id,
    sender: fromUser ? consultation.user : consultation.astrologer,
    senderModel: fromUser ? 'User' : 'Astrologer',
    receiver: fromUser ? consultation.astrologer : consultation.user,
    message: text,
  });
  const room = roomName(consultation.id);
  if (!fromUser) {
    // An astrologer reply implies they have seen the user's messages.
    await Message.updateMany({ consultation: consultation._id, senderModel: 'User', isRead: false }, { isRead: true });
    io.to(room).emit('chat:read', { by: 'ASTROLOGER' });
  }
  io.to(room).emit('chat:message', serializeMessage(msg));
  return msg;
}

const CANNED = [
  'Namaste! I have noted your details. Could you share your date, time and place of birth?',
  'Thank you. Based on what you shared, the coming weeks look favourable if you stay patient.',
  'That is a good question. Let me look at the planetary positions and guide you.',
];

/** Testing helper (DEMO_AUTO_REPLY=true): lets a lone developer see both sides of a chat. */
export function scheduleDemoReply(io, consultationId) {
  if (!env.demoAutoReply) return;
  const room = roomName(consultationId);
  io.to(room).emit('chat:typing', { isTyping: true, by: 'ASTROLOGER' });
  setTimeout(async () => {
    try {
      const c = await Consultation.findById(consultationId);
      io.to(room).emit('chat:typing', { isTyping: false, by: 'ASTROLOGER' });
      if (c && c.status === 'ACTIVE' && c.expiresAt > new Date()) {
        await postMessage(io, c, 'ASTROLOGER', CANNED[Math.floor(Math.random() * CANNED.length)]);
      }
    } catch (e) {
      console.error('demo reply failed', e.message);
    }
  }, 1800);
}
