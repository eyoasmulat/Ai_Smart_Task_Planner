
import { Router } from 'express';
import {
  createPlanController,
  deletePlanController,
  getAllPlansController,
  getPlanByIdController,
  updatePlanController,
} from '../controllers/plan.controller.js';

const router = Router();

router.get('/', getAllPlansController);
router.post('/', createPlanController);
router.patch('/:id', updatePlanController);
router.delete('/:id', deletePlanController);
router.get('/:id', getPlanByIdController);

export default router;
