import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { endConsultation, getConsultation, myConsultations } from '../controllers/consultation.controller.js';

const router = Router();
router.use(protect);
router.get('/mine', myConsultations);
router.get('/:id', getConsultation);
router.post('/:id/end', endConsultation);

export default router;
