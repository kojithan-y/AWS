import { useCallback, useEffect, useState } from "react";
import { paths } from "../config.js";
import { getJson, postJson, putJson, deleteJson } from "../api.js";

const empty = {
  teacherId: "",
  name: "",
  email: "",
  department: "",
  studentIdsText: "",
};

function parseIds(text) {
  if (!text || !String(text).trim()) return [];
  return String(text)
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function pickId(doc) {
  if (!doc) return "";
  return doc._id || doc.teacherId;
}

export function TeachersView() {
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
      const data = await getJson(paths.teachers());
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

  function startEdit(t) {
    setEditingId(pickId(t));
    setForm({
      teacherId: t.teacherId ?? "",
      name: t.name ?? "",
      email: t.email ?? "",
      department: t.department ?? "",
      studentIdsText: (t.studentIds && t.studentIds.length
        ? t.studentIds
        : []
      ).join(", "),
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
      teacherId: form.teacherId.trim(),
      name: form.name.trim(),
      email: form.email.trim(),
      department: form.department.trim() || undefined,
      studentIds: parseIds(form.studentIdsText),
    };
    try {
      if (editingId) {
        await putJson(paths.teacherById(editingId), body);
        cancelEdit();
      } else {
        await postJson(paths.teachers(), body);
        setForm(empty);
      }
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(t) {
    if (!window.confirm("Delete this teacher?")) return;
    setBusy(true);
    setError(null);
    try {
      await deleteJson(paths.teacherById(pickId(t)));
      if (editingId && pickId(t) === editingId) cancelEdit();
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
        <h2>Teachers</h2>
        <button type="button" className="btn secondary" onClick={load} disabled={loading || busy}>
          Refresh
        </button>
      </div>
      {error && <p className="msg error">{error}</p>}

      <form className="form-grid" onSubmit={handleSubmit}>
        <h3 className="form-title">{editingId ? "Edit teacher" : "Add teacher"}</h3>
        <label>
          <span>Teacher ID *</span>
          <input
            required
            value={form.teacherId}
            disabled={!!editingId}
            onChange={(e) => setForm((f) => ({ ...f, teacherId: e.target.value }))}
            placeholder="T001"
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
        <label className="span-2">
          <span>Department</span>
          <input
            value={form.department}
            onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
            placeholder="Computer Science"
          />
        </label>
        <label className="span-2">
          <span>Supervised student IDs</span>
          <input
            value={form.studentIdsText}
            onChange={(e) => setForm((f) => ({ ...f, studentIdsText: e.target.value }))}
            placeholder="S001, S002 (comma or space separated)"
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
                <th>Department</th>
                <th>Students</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr>
                  <td colSpan={6} className="muted">
                    No teachers yet.
                  </td>
                </tr>
              )}
              {list.map((t) => (
                <tr key={t._id || t.teacherId}>
                  <td>{t.teacherId}</td>
                  <td>{t.name}</td>
                  <td>{t.email}</td>
                  <td>{t.department || "—"}</td>
                  <td>
                    {t.studentIds && t.studentIds.length
                      ? t.studentIds.join(", ")
                      : "—"}
                  </td>
                  <td className="row-actions">
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => startEdit(t)}
                      disabled={busy}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="link-btn danger"
                      onClick={() => handleDelete(t)}
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
