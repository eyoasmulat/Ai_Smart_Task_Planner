
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import healthRoutes from './routes/health.routes.js';
import planRoutes from './routes/plan.routes.js';
import taskRoutes from './routes/task.routes.js';
import { errorHandler } from './middleware/error.middleware.js';
import geminiRoutes from './routes/gemini.routes.js';
import calendarRoutes from './routes/calendar.routes.js';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(
  cors({
    origin: 'http://localhost:5173',
  }),
);
app.use(express.json());


app.get('/', (_req, res) => {
  res.json({
    message: 'Welcome to AI Smart Task Planner API',
  });
});

app.use('/api/health', healthRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/gemini', geminiRoutes);
app.use('/api/calendar', calendarRoutes);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`server is running at http://localhost:${PORT}`);
});
