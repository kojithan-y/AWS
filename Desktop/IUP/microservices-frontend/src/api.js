async function parseBody(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function errorMessage(data, res) {
  if (!data) return res.statusText || "Request failed";
  if (typeof data === "string") return data;
  if (data.message) return data.message;
  if (data.error) return data.error;
  return res.statusText || "Request failed";
}

export async function getJson(url) {
  const res = await fetch(url);
  const data = await parseBody(res);
  if (!res.ok) throw new Error(errorMessage(data, res));
  return data;
}

export async function sendJson(url, method, body) {
  const headers = {};
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await parseBody(res);
  if (!res.ok) throw new Error(errorMessage(data, res));
  return data;
}

export const postJson = (url, body) => sendJson(url, "POST", body);
export const putJson = (url, body) => sendJson(url, "PUT", body);
export const deleteJson = (url) => sendJson(url, "DELETE", undefined);
