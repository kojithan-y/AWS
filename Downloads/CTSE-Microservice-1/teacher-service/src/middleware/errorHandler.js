function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    next(err);
    return;
  }
  const status = err.status || err.statusCode || 500;
  const message = status === 500 ? 'Internal server error' : err.message;
  if (status === 500 && process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.error(err);
  }
  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && status === 500 ? { detail: err.message } : {}),
  });
}

module.exports = { errorHandler };
