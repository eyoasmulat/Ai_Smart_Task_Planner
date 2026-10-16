
import { Router } from 'express';
import {
  connectGoogleCalendar,
  googleCalendarCallback,
  googleCalendarStatus,
  addTaskToGoogleCalendar,
} from '../controllers/calendar.controller.js';

const router = Router();

router.get('/connect', connectGoogleCalendar);
router.get('/callback', googleCalendarCallback);
router.get('/status', googleCalendarStatus);
router.post('/tasks/:id', addTaskToGoogleCalendar);

export default router;
