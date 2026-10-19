import Consultation from '../models/Consultation.js';

export const roomName = (id) => `consultation:${id}`;

/** Marks an ACTIVE consultation as COMPLETED and tells everyone in its room. */
export async function completeConsultation(consultation, io) {
  if (!consultation || consultation.status !== 'ACTIVE') return consultation;
  consultation.status = 'COMPLETED';
  consultation.endTime = new Date(Math.min(Date.now(), consultation.expiresAt.getTime()));
  await consultation.save();
  io?.to(roomName(consultation.id)).emit('consultation:ended', { consultationId: consultation.id });
  return consultation;
}

/** Periodic job: expire timed-out consultations and stale unpaid ones. */
export async function sweepExpired(io) {
  const due = await Consultation.find({ status: 'ACTIVE', expiresAt: { $lte: new Date() } });
  for (const c of due) await completeConsultation(c, io);
  await Consultation.updateMany(
    { status: 'PENDING', createdAt: { $lt: new Date(Date.now() - 30 * 60 * 1000) } },
    { status: 'EXPIRED' }
  );
}
