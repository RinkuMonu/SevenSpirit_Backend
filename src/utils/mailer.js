import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter;
export async function sendMail({ to, subject, html, text }) {
  if (!env.smtp.host) {
    console.log(`\n[mail disabled] To: ${to}\nSubject: ${subject}\n${text || html}\n`);
    return;
  }
  transporter ??= nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
  });
  await transporter.sendMail({ from: env.smtp.from, to, subject, html, text });
}
