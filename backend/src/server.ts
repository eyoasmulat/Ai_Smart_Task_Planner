import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors({
  origin: 'http://localhost:5173',
}));

app.use(express.json());

app.get('/', (_req, res) => {
  res.json({
    message: 'AI Smart Task Planner API is running!',
  });
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'OK',
    message: 'Backend is working correctly',
  });
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});