const request = require('supertest');
const mongoose = require('mongoose');
const { createApp } = require('../src/app');
const { connectMongo, disconnectMongo } = require('../src/db');

jest.setTimeout(120000);

describe('Exam Service', () => {
  let app;
  let mongoServer;

  beforeAll(async () => {
    let uri = process.env.MONGODB_URI;
    if (!uri) {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
    }
    await connectMongo(uri);
    app = createApp();
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
    }
    await disconnectMongo();
    if (mongoServer) await mongoServer.stop();
  });

  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('exam-service');
  });

  it('POST /exams creates an exam', async () => {
    const res = await request(app)
      .post('/exams')
      .send({
        examId: 'EX2024001',
        title: 'Data Structures — Final',
        courseCode: 'CS201',
        teacherId: 'T2024001',
        enrolledStudentIds: ['IT2024001'],
        scheduledAt: '2025-06-15T09:00:00.000Z',
        venue: 'Hall A',
      });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.examId).toBe('EX2024001');
  });

  it('GET /exams lists exams', async () => {
    const res = await request(app).get('/exams');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.exams)).toBe(true);
  });

  it('GET /exams/teacher/:teacherId lists exams for teacher', async () => {
    const res = await request(app).get('/exams/teacher/T2024001');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.exams)).toBe(true);
    expect(res.body.exams.length).toBeGreaterThan(0);
  });

  it('GET /exams/student/:studentId lists exams for student', async () => {
    const res = await request(app).get('/exams/student/IT2024001');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.exams)).toBe(true);
  });

  it('GET /openapi.json serves contract', async () => {
    const res = await request(app).get('/openapi.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.3');
  });

  it('GET /api-docs serves Swagger UI', async () => {
    const res = await request(app).get('/api-docs/');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('swagger');
  });
});
