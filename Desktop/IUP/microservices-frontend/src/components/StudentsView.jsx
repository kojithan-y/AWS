import { useCallback, useEffect, useState } from "react";
import { paths } from "../config.js";
import { getJson, postJson, putJson, deleteJson } from "../api.js";

const empty = {
  studentId: "",
  name: "",
  email: "",
  age: "",
  batch: "",
  major: "",
};

function numOrUndef(v) {
  if (v === "" || v === null || v === undefined) return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
}

function pickId(doc) {
  if (!doc) return "";
  return doc._id || doc.studentId;
}

export function StudentsView() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await getJson(paths.students());
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(t);
  }, [load]);

  function startEdit(s) {
    setEditingId(pickId(s));
    setForm({
      studentId: s.studentId ?? "",
      name: s.name ?? "",
      email: s.email ?? "",
      age: s.age != null ? String(s.age) : "",
      batch: s.batch ?? "",
      major: s.major ?? "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(empty);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const body = {
      studentId: form.studentId.trim(),
      name: form.name.trim(),
      email: form.email.trim(),
      age: numOrUndef(form.age),
      batch: form.batch.trim() || undefined,
      major: form.major.trim() || undefined,
    };
    try {
      if (editingId) {
        await putJson(paths.studentById(editingId), body);
        cancelEdit();
      } else {
        await postJson(paths.students(), body);
        setForm(empty);
      }
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(s) {
    if (!window.confirm("Delete this student?")) return;
    setBusy(true);
    setError(null);
    try {
      await deleteJson(paths.studentById(pickId(s)));
      if (editingId && pickId(s) === editingId) cancelEdit();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Students</h2>
        <button type="button" className="btn secondary" onClick={load} disabled={loading || busy}>
          Refresh
        </button>
      </div>
      {error && <p className="msg error">{error}</p>}

      <form className="form-grid" onSubmit={handleSubmit}>
        <h3 className="form-title">{editingId ? "Edit student" : "Add student"}</h3>
        <label>
          <span>Student ID *</span>
          <input
            required
            value={form.studentId}
            disabled={!!editingId}
            onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))}
            placeholder="S001"
          />
        </label>
        <label>
          <span>Name *</span>
          <input
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </label>
        <label>
          <span>Email *</span>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </label>
        <label>
          <span>Age</span>
          <input
            type="number"
            min={0}
            value={form.age}
            onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
          />
        </label>
        <label>
          <span>Batch</span>
          <input
            value={form.batch}
            onChange={(e) => setForm((f) => ({ ...f, batch: e.target.value }))}
            placeholder="2026"
          />
        </label>
        <label className="span-2">
          <span>Major</span>
          <input
            value={form.major}
            onChange={(e) => setForm((f) => ({ ...f, major: e.target.value }))}
            placeholder="Software Engineering"
          />
        </label>
        <div className="form-actions">
          <button className="btn" type="submit" disabled={busy}>
            {editingId ? "Save" : "Create"}
          </button>
          {editingId && (
            <button type="button" className="btn secondary" onClick={cancelEdit} disabled={busy}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Age</th>
                <th>Batch</th>
                <th>Major</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr>
                  <td colSpan={7} className="muted">
                    No students yet.
                  </td>
                </tr>
              )}
              {list.map((s) => (
                <tr key={s._id || s.studentId}>
                  <td>{s.studentId}</td>
                  <td>{s.name}</td>
                  <td>{s.email}</td>
                  <td>{s.age != null ? s.age : "—"}</td>
                  <td>{s.batch || "—"}</td>
                  <td>{s.major || "—"}</td>
                  <td className="row-actions">
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => startEdit(s)}
                      disabled={busy}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="link-btn danger"
                      onClick={() => handleDelete(s)}
                      disabled={busy}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
