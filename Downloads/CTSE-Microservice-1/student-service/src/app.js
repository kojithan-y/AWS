const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const openapiSpec = require('../openapi/openapi.json');
const studentsRouter = require('./routes/students');
const { errorHandler } = require('./middleware/errorHandler');

function createApp() {
  const app = express();

  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
          fontSrc: ["'self'", 'data:'],
        },
      },
    }),
  );
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || false,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '64kb' }));

  const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX || 120),
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => /^\/api-docs(\/|$)/.test(req.path),
  });
  app.use(limiter);

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'student-service', timestamp: new Date().toISOString() });
  });

  app.get('/openapi.json', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'openapi', 'openapi.json'));
  });

  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(openapiSpec, {
      explorer: true,
      customSiteTitle: 'Student Service API',
    }),
  );

  app.use('/students', studentsRouter);

  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
