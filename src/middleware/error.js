import { env } from '../config/env.js';

export const notFound = (req, res) => res.status(404).json({ success: false, message: 'Route not found' });

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message;

  if (err.name === 'CastError') { status = 400; message = 'Invalid identifier'; }
  if (err.name === 'ValidationError') { status = 400; message = Object.values(err.errors)[0]?.message || message; }
  if (err.code === 11000) { status = 409; message = `${Object.keys(err.keyValue || {})[0] || 'Value'} is already in use`; }
  if (err.type === 'entity.parse.failed') { status = 400; message = 'Invalid JSON body'; }

  if (status >= 500) {
    console.error(err);
    if (env.nodeEnv === 'production') message = 'Internal server error';
  }
  res.status(status).json({ success: false, message });
};
