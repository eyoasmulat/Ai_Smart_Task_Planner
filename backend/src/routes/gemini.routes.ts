
import { Router } from 'express';
import { generatePlanController } from '../controllers/gemini.controller.js';

const router = Router();

router.post('/generate', generatePlanController);

export default router;
