# Student Service (Node.js)

Microservice for **student registration and profiles**, with HTTP integration hooks for the **Exam** and **Teacher** services (`GET /students/:id/summary`).

## Run locally

Requires MongoDB (local install, Docker, or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)). Set `MONGODB_URI` in `.env`.

```bash
cd student-service
cp .env.example .env
npm install
npm test
npm start
```

`npm test` spins up an in-memory MongoDB (`mongodb-memory-server`) unless you set `MONGODB_URI` (e.g. to hit Docker: `docker compose up -d` then `MONGODB_URI=mongodb://127.0.0.1:27017/student-service-test npm test`). For `npm start`, set `MONGODB_URI` in `.env`.

- Health: `GET http://localhost:3000/health`
- **Swagger UI (try endpoints):** `http://localhost:3000/api-docs/`
- OpenAPI JSON: `GET http://localhost:3000/openapi.json`
- API files: `openapi/openapi.yaml`, `openapi/openapi.json`

## Docker

```bash
docker build -t student-service:local .
docker run --rm -p 3000:3000 -e EXAM_SERVICE_URL=https://exam-example.example.com student-service:local
```

## CI/CD & security

- GitHub Actions: `.github/workflows/ci.yml` (build, test, Docker, SonarCloud SAST).
- Configure SonarCloud and edit `sonar-project.properties` (see `DEPLOYMENT.txt`).

## Integration with teammates

Set `EXAM_SERVICE_URL` and `TEACHER_SERVICE_URL` to your group’s deployed base URLs. Align paths in `src/services/integrationClient.js` with their OpenAPI specs if they differ from the defaults documented there.
