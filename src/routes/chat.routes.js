import { Router } from 'express';
import { body } from 'express-validator';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { astrologerReply, getMessages } from '../controllers/chat.controller.js';

const router = Router();
router.get('/:consultationId/messages', protect, getMessages);
router.post('/:consultationId/astrologer-reply', [
  body('message').trim().isLength({ min: 1, max: 1000 }).withMessage('Message must be 1–1000 characters'),
], validate, astrologerReply);

export default router;
