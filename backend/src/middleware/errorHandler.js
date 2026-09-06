// Centralized error handler — never leak stack traces or secrets to the client.
function notFound(req, res, next) {
  res.status(404);
  next(new Error(`Route not found: ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  const nodeEnv = process.env.NODE_ENV;

  // Multer surfaces file-too-large / unexpected-field errors with its own
  // error class, not via res.status() — translate it into a clean 400 here
  // rather than letting it fall through as a generic 500.
  let message = err.message || 'Internal server error';
  if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') message = 'File is too large';
  }

  console.error(`[error] ${statusCode} ${req.method} ${req.originalUrl}:`, err.message);

  res.status(statusCode).json({
    success: false,
    message,
    ...(nodeEnv === 'development' ? { stack: err.stack } : {}),
  });
}

module.exports = { notFound, errorHandler };
