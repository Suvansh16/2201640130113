// src/logger.js
import fs from 'fs';
import path from 'path';

const LOG_DIR = path.resolve(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'app.log');

function ensureLogFile() {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
  if (!fs.existsSync(LOG_FILE)) fs.writeFileSync(LOG_FILE, '');
}

function appendLine(line) {
  ensureLogFile();
  // async append; intentionally not using console
  fs.appendFile(LOG_FILE, line + '\n', () => {});
}

function fmt(obj) {
  // structured JSON log line
  return JSON.stringify({ ts: new Date().toISOString(), ...obj });
}

/**
 * Logging middleware - attaches req.log with methods info/warn/error
 * and logs incoming request and completion (status + duration).
 */
export function LoggingMiddleware(req, res, next) {
  const start = Date.now();

  req.log = {
    info: (msg, extra = {}) => appendLine(fmt({ level: 'INFO', msg, ...extra })),
    warn: (msg, extra = {}) => appendLine(fmt({ level: 'WARN', msg, ...extra })),
    error: (msg, extra = {}) => appendLine(fmt({ level: 'ERROR', msg, ...extra }))
  };

  req.log.info('incoming_request', {
    method: req.method,
    path: req.originalUrl,
    ip: req.ip
  });

  res.on('finish', () => {
    req.log.info('request_completed', {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      duration_ms: Date.now() - start
    });
  });

  next();
}
