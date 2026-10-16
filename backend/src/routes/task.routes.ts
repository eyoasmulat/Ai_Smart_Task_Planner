import { Router } from 'express';
import {
  updateTaskController,
  deleteTaskController,
} from '../controllers/task.controller.js';

const router = Router();

router.patch('/:id', updateTaskController);
router.delete('/:id', deleteTaskController);

export default router;