const request = require('supertest');
const mongoose = require('mongoose');
const { createApp } = require('../src/app');
const { connectMongo, disconnectMongo } = require('../src/db');

jest.setTimeout(120000);

describe('Student Service', () => {
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
    expect(res.body.service).toBe('student-service');
  });

  it('POST /students creates a student', async () => {
    const res = await request(app)
      .post('/students')
      .send({
        studentId: 'IT2024001',
        fullName: 'Test User',
        email: 'test.user@example.com',
        programme: 'BSc SE',
      });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.studentId).toBe('IT2024001');
  });

  it('GET /students lists students', async () => {
    const res = await request(app).get('/students');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.students)).toBe(true);
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
