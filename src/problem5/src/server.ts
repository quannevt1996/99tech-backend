import { createApp } from './app.js';
import { getConfig } from './config.js';
import { openDatabase } from './db.js';

const config = getConfig();
const db = openDatabase(config.databasePath);
const app = createApp(db);

const server = app.listen(config.port, e => {
  if (e) {
    db.close();
    throw e;
  }
  process.stdout.write(`Listening on http://localhost:${config.port}, database at ${config.databasePath}\n`);
});

const shutdown = (signal: NodeJS.Signals) => {
  process.stdout.write(`${signal} received, shutting down\n`);
  server.close(() => {
    db.close();
  });
};

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
