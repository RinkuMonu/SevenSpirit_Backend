import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/error.js';
import authRoutes from './routes/auth.routes.js';
import astrologerRoutes from './routes/astrologer.routes.js';
import consultationRoutes from './routes/consultation.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import chatRoutes from './routes/chat.routes.js';
import reviewRoutes from './routes/review.routes.js';
import seoRoutes from './routes/seo.routes.js';

const app = express();
app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin(origin, cb) {
    if (!origin || env.clientOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Origin not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '50kb' }));
app.use(mongoSanitize());
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 600, standardHeaders: true, legacyHeaders: false }));

app.get('/api/v1/health', (req, res) => res.json({ success: true, status: 'ok' }));
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/astrologers', astrologerRoutes);
app.use('/api/v1/consultations', consultationRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/', seoRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
