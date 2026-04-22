require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const examRoutes = require('./routes/examRoutes');

const app = express();
const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI;

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Exam Microservice API',
      version: '1.0.0',
      description:
        'RESTful API for exams. Validates students and teachers via the Student and Teacher microservices; exposes data for student-level aggregation.',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Local server',
      },
    ],
    components: {
      schemas: {
        Exam: {
          type: 'object',
          required: ['examId', 'title', 'studentId'],
          properties: {
            examId: { type: 'string', example: 'E001' },
            title: { type: 'string', example: 'Midterm — Software Architecture' },
            courseCode: { type: 'string', example: 'IT4130' },
            studentId: { type: 'string', example: 'S001' },
            teacherId: { type: 'string', example: 'T001' },
            examDate: { type: 'string', format: 'date-time' },
            maxScore: { type: 'number', example: 100 },
            score: { type: 'number', example: 85 },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
  },
  apis: ['./routes/examRoutes.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Exam Service is running' });
});

app.use('/api/exams', examRoutes);

if (!MONGO_URI) {
  console.error('Missing MONGO_URI in environment');
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
      console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
