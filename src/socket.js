import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import User from './models/User.js';
import Consultation from './models/Consultation.js';
import Message from './models/Message.js';
import { completeConsultation, roomName } from './services/consultationService.js';
import { postMessage, scheduleDemoReply } from './services/chatService.js';

const safeEqual = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

export function initSocket(server) {
  const io = new Server(server, { cors: { origin: env.clientOrigins, credentials: true } });

  // Auth: users connect with their JWT. Your own astrologer-side tooling may connect with ASTROLOGER_API_KEY.
  io.use(async (socket, next) => {
    try {
      const { token, astrologerKey } = socket.handshake.auth || {};
      if (astrologerKey) {
        if (!env.astrologerApiKey || !safeEqual(astrologerKey, env.astrologerApiKey)) throw new Error('bad key');
        socket.data.role = 'ASTROLOGER';
        return next();
      }
      const payload = jwt.verify(token, env.jwtSecret);
      const user = await User.findById(payload.id).select('_id');
      if (!user) throw new Error('no user');
      socket.data.role = 'USER';
      socket.data.userId = user._id;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const isUser = socket.data.role === 'USER';
    const inRoom = (id) => socket.rooms.has(roomName(id));
    // Ownership check: a user can only ever load their own consultation.
    const load = async (id) => {
      if (!mongoose.isValidObjectId(id)) return null;
      return isUser ? Consultation.findOne({ _id: id, user: socket.data.userId }) : Consultation.findById(id);
    };

    socket.on('room:join', async ({ consultationId } = {}, ack) => {
      try {
        const c = await load(consultationId);
        if (!c || c.status !== 'ACTIVE') return ack?.({ ok: false, error: 'Consultation is not active' });
        if (c.expiresAt <= new Date()) {
          await completeConsultation(c, io);
          return ack?.({ ok: false, error: 'Consultation has ended' });
        }
        const room = roomName(c.id);
        socket.join(room);
        const peers = (await io.in(room).fetchSockets()).filter((s) => s.id !== socket.id).length;
        ack?.({ ok: true, peers });
      } catch {
        ack?.({ ok: false, error: 'Unable to join' });
      }
    });

    socket.on('chat:send', async ({ consultationId, message } = {}, ack) => {
      try {
        if (!inRoom(consultationId)) return ack?.({ ok: false, error: 'Join the consultation first' });
        const text = String(message || '').trim().slice(0, 1000);
        if (!text) return ack?.({ ok: false, error: 'Message is empty' });
        const c = await load(consultationId);
        if (!c || c.type !== 'CHAT') return ack?.({ ok: false, error: 'Not a chat consultation' });
        if (c.status !== 'ACTIVE' || c.expiresAt <= new Date()) {
          await completeConsultation(c, io);
          return ack?.({ ok: false, error: 'Your consultation has ended.' });
        }
        const msg = await postMessage(io, c, isUser ? 'USER' : 'ASTROLOGER', text);
        ack?.({ ok: true, id: msg.id });
        if (isUser) scheduleDemoReply(io, c._id);
      } catch {
        ack?.({ ok: false, error: 'Message could not be sent' });
      }
    });

    socket.on('chat:typing', ({ consultationId, isTyping } = {}) => {
      if (inRoom(consultationId)) {
        socket.to(roomName(consultationId)).emit('chat:typing', { isTyping: !!isTyping, by: socket.data.role });
      }
    });

    // The user has seen the astrologer's messages.
    socket.on('chat:read', async ({ consultationId } = {}) => {
      if (!isUser || !inRoom(consultationId)) return;
      await Message.updateMany({ consultation: consultationId, senderModel: 'Astrologer', isRead: false }, { isRead: true });
      socket.to(roomName(consultationId)).emit('chat:read', { by: 'USER' });
    });

    // --- WebRTC signalling (audio today; add video tracks later without server changes) ---
    socket.on('call:ready', ({ consultationId } = {}) => {
      if (inRoom(consultationId)) socket.to(roomName(consultationId)).emit('call:peer-ready', { by: socket.data.role });
    });
    socket.on('call:signal', ({ consultationId, data } = {}) => {
      if (inRoom(consultationId) && data && typeof data === 'object') {
        socket.to(roomName(consultationId)).emit('call:signal', data);
      }
    });

    socket.on('disconnecting', () => {
      for (const room of socket.rooms) {
        if (room.startsWith('consultation:')) socket.to(room).emit('call:peer-left', { by: socket.data.role });
      }
    });
  });

  return io;
}
