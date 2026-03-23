import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './db.js';
import projectsRouter from './routes/projects.js';
import globalSettingsRouter from './routes/globalSettings.js';
import completionsRouter from './routes/completions.js';
import confusionLogRouter from './routes/confusionLog.js';
import weekNotesRouter from './routes/weekNotes.js';
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

// Mount API routes — project CRUD and global settings
app.use('/api/projects', projectsRouter);
app.use('/api/global-settings', globalSettingsRouter);

// Mount project-scoped data routes
app.use('/api/projects/:projectId/completions', completionsRouter);
app.use('/api/projects/:projectId/confusion-log', confusionLogRouter);
app.use('/api/projects/:projectId/week-notes', weekNotesRouter);
app.use('/api/projects/:projectId/subtask-completions', subtaskCompletionsRouter);
app.use('/api/projects/:projectId/study-plan', studyPlanRouter);

// Global backup route
app.use('/api/backup', backupRouter);

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
