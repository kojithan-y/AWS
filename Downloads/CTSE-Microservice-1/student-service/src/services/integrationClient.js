/**
 * HTTP integration with peer microservices (Exam + Teacher).
 * Uses short timeouts and returns structured errors so the Student API stays responsive.
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

/**
 * Example integration: call Exam service health (or exams list) — adjust path to match your team's OpenAPI.
 */
async function getExamServiceHealth(examServiceUrl) {
  return fetchJson(examServiceUrl, '/health');
}

/**
 * Example: fetch exams for a student — path is illustrative; align with Exam team's contract.
 */
async function getExamsForStudent(examServiceUrl, studentId) {
  return fetchJson(examServiceUrl, `/exams/student/${encodeURIComponent(studentId)}`);
}

/**
 * Example: verify teacher exists — path illustrative; align with Teacher team's contract.
 */
async function getTeacherById(teacherServiceUrl, teacherId) {
  return fetchJson(teacherServiceUrl, `/teachers/${encodeURIComponent(teacherId)}`);
}

module.exports = {
  fetchJson,
  getExamServiceHealth,
  getExamsForStudent,
  getTeacherById,
};
