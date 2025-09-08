// src/server.js
import express from 'express';
import dotenv from 'dotenv';
import routes from './routes.js';
import { LoggingMiddleware } from './logger.js';
import { errorHandler } from './errors.js';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();

// security: hide powered-by
app.disable('x-powered-by');

// JSON body parsing
app.use(express.json({ limit: '20kb' }));

// Custom logging middleware (MANDATORY)
app.use(LoggingMiddleware);

// Basic health check
app.get('/health', (req, res) => res.json({ ok: true }));

// Routes (create, analytics, redirect)
app.use('/', routes);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOSTNAME || 'http://localhost';
app.listen(PORT);

// Also log server start using our logging mechanism (no console)
(function logStart() {
  // logger.js does not export a write function; we can simulate a simple logging write here:
  const LOG_DIR = path.resolve(process.cwd(), 'logs');
  const LOG_FILE = path.join(LOG_DIR, 'app.log');
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
  const line = JSON.stringify({ ts: new Date().toISOString(), level: 'INFO', msg: 'server_started', host: `${HOST}:${PORT}` });
  fs.appendFileSync(LOG_FILE, line + '\n');
})();
