// src/errors.js
export class AppError extends Error {
  constructor(message, status = 400, code = 'BAD_REQUEST') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/**
 * Express error handler - returns JSON with { error: { code, message } }
 * Also logs via req.log if available.
 */
export function errorHandler(err, req, res, _next) {
  const status = err?.status || 500;
  const body = {
    error: {
      code: err?.code || 'INTERNAL_ERROR',
      message: err?.message || 'Internal Server Error'
    }
  };

  if (req?.log) {
    req.log.error('error', { status, code: body.error.code, message: body.error.message });
  }

  res.status(status).json(body);
}
