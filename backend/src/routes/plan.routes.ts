
import { Router } from 'express';
import {
  createPlanController,
  getAllPlansController,
  getPlanByIdController,
} from '../controllers/plan.controller.js';

const router = Router();

router.get('/', getAllPlansController);
router.post('/', createPlanController);
router.get('/:id', getPlanByIdController);

export default router;
