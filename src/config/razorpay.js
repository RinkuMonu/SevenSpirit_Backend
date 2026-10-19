import Razorpay from 'razorpay';
import { env } from './env.js';
import { AppError } from '../utils/index.js';

let instance;
export function getRazorpay() {
  if (!env.razorpayKeyId || !env.razorpayKeySecret) {
    throw new AppError('Payments are not configured on the server', 503);
  }
  if (!instance) instance = new Razorpay({ key_id: env.razorpayKeyId, key_secret: env.razorpayKeySecret });
  return instance;
}
