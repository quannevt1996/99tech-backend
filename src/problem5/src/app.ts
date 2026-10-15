import express from 'express';
import { createAlertRepository } from './alerts/alert.repository.js';
import { createAlertRouter } from './alerts/alert.router.js';
import type { Database } from './db.js';
import { errorHandler, notFound } from './errors.js';

export const createApp = (db: Database) => {
  const app = express();
  app.disable('x-powered-by');

  app.use(express.json({ limit: '16kb' }));

  app.use('/alerts', createAlertRouter(createAlertRepository(db)));

  app.use(notFound);
  app.use(errorHandler);

  return app;
};
