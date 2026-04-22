/**
 * HTTP calls to Student and Exam services (configure base URLs via env).
 */

const DEFAULT_TIMEOUT_MS = 5000;

async function fetchJson(baseUrl, path, options = {}) {
  if (!baseUrl || typeof baseUrl !== 'string') {
    return { ok: false, skipped: true, reason: 'Service URL not configured' };
  }
  const url = `${baseUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), options.timeoutMs || DEFAULT_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        Accept: 'application/json',
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });
    const text = await res.text();
    let body = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = { raw: text };
    }
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        body,
        url,
      };
    }
    return { ok: true, status: res.status, body, url };
  } catch (err) {
    return {
      ok: false,
      error: err.name === 'AbortError' ? 'timeout' : err.message,
      url,
    };
  } finally {
    clearTimeout(t);
  }
}

async function getStudentServiceHealth(studentServiceUrl) {
  return fetchJson(studentServiceUrl, '/health');
}

/** Align path with Student team OpenAPI — default GET /students/:uuid */
async function getStudentById(studentServiceUrl, studentUuid) {
  return fetchJson(studentServiceUrl, `/students/${encodeURIComponent(studentUuid)}`);
}

async function getExamServiceHealth(examServiceUrl) {
  return fetchJson(examServiceUrl, '/health');
}

/** Example: exams supervised by this teacher — adjust to Exam team's contract */
async function getExamsForTeacher(examServiceUrl, teacherId) {
  return fetchJson(examServiceUrl, `/exams/teacher/${encodeURIComponent(teacherId)}`);
}

module.exports = {
  fetchJson,
  getStudentServiceHealth,
  getStudentById,
  getExamServiceHealth,
  getExamsForTeacher,
};
