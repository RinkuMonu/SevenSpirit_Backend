import { Router } from 'express';
import { featuredAstrologers, getAstrologer, listAstrologers } from '../controllers/astrologer.controller.js';

const router = Router();
router.get('/', listAstrologers);
router.get('/featured', featuredAstrologers);
router.get('/:slug', getAstrologer);

export default router;
