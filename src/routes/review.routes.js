import { Router } from 'express';
import { body } from 'express-validator';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { astrologerReviews, createReview } from '../controllers/review.controller.js';

const router = Router();
router.get('/astrologer/:astrologerId', astrologerReviews);
router.post('/', protect, [
  body('consultationId').isMongoId().withMessage('Invalid consultation'),
  body('rating').toInt().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('review').optional({ values: 'falsy' }).trim().isLength({ max: 1000 }).withMessage('Review is too long'),
], validate, createReview);

export default router;
