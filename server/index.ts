import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './db.js';
import completionsRouter from './routes/completions.js';
import confusionLogRouter from './routes/confusionLog.js';
import weekNotesRouter from './routes/weekNotes.js';
import settingsRouter from './routes/settings.js';
import backupRouter from './routes/backup.js';
import subtaskCompletionsRouter from './routes/subtaskCompletions.js';
import studyPlanRouter from './routes/studyPlan.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3001;

// Initialize database tables
initDatabase();

const app = express();

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Mount API routes
app.use('/api/completions', completionsRouter);
app.use('/api/confusion-log', confusionLogRouter);
app.use('/api/week-notes', weekNotesRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/backup', backupRouter);
app.use('/api/subtask-completions', subtaskCompletionsRouter);
app.use('/api/study-plan', studyPlanRouter);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('/{*path}', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
