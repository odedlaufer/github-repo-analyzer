// src/app.ts
import './config/env.js';
import express from 'express';
import repoAnalyzerRoutes from './api/repoAnalyzer.js';
import { errorHandler } from './utils/errorHandler.js';

// Swagger
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';

export function createApp() {
  const app = express();

  app.use(express.json());

  // Swagger Docs
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use('/api/repo', repoAnalyzerRoutes);

  app.get('/health', (_, res) => res.send('OK'));

  app.use(errorHandler);

  return app;
}
