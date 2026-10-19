import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.js';
import { AppError, asyncHandler } from '../utils/index.js';

export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new AppError('Please login to continue', 401);

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw new AppError('Session expired. Please login again.', 401);
  }
  const user = await User.findById(payload.id);
  if (!user) throw new AppError('Account no longer exists', 401);
  req.user = user;
  next();
});
