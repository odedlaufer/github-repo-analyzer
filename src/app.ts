import './config/env.js';
import express from 'express';
import repoAnalyzerRoutes from './api/repoAnalyzer.js';
import { errorHandler } from './utils/errorHandler.js';

const app = express();

app.use(express.json());
app.use('/api/repo', repoAnalyzerRoutes);

app.get('/health', (_, res) => res.send('OK'));

app.use(errorHandler);

export default app;
