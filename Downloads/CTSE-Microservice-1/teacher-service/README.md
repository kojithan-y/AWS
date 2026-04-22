# Teacher Service (Node.js)

Registers **teachers** and exposes HTTP integration with the **Student** and **Exam** services via `GET /teachers/:id/summary`.

## Run locally

Default port is **3001** (so it can run beside Student Service on 3000).

```bash
cd teacher-service
cp .env.example .env
npm install
npm test
npm start
```

- Health: `GET http://localhost:3001/health`
- **Swagger UI (try endpoints):** `http://localhost:3001/api-docs/`
- OpenAPI: `GET http://localhost:3001/openapi.json`

## Docker

```bash
docker build -t teacher-service:local .
docker run --rm -p 3001:3001 -e STUDENT_SERVICE_URL=http://host.docker.internal:3000 teacher-service:local
```

## Integration env vars

| Variable | Purpose |
|----------|---------|
| `STUDENT_SERVICE_URL` | Base URL of Student Service (`/health`, `GET /students/:uuid`) |
| `EXAM_SERVICE_URL` | Base URL of Exam Service (`/health`, `GET /exams/teacher/:teacherId` — align with Exam team) |
| `DEMO_STUDENT_UUID` | Optional UUID from Student Service to fetch a sample student in the summary |

## CI/CD

Workflow lives under `student-service/.github/workflows/ci.yml` in this monorepo and builds both **student-service** and **teacher-service**. If your GitHub repo root is only `teacher-service`, move `.github` to the repo root and adjust paths.
