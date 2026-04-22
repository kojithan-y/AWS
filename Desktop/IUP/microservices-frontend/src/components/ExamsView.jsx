import { Fragment, useCallback, useEffect, useState } from "react";
import { paths } from "../config.js";
import { getJson, postJson, putJson, deleteJson } from "../api.js";

const empty = {
  examId: "",
  title: "",
  courseCode: "",
  studentId: "",
  teacherId: "",
  examDateLocal: "",
  maxScore: "",
  score: "",
};

function pickId(doc) {
  if (!doc) return "";
  return doc._id || doc.examId;
}

function toDateTimeLocal(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function buildExamBody(form) {
  const body = {
    examId: form.examId.trim(),
    title: form.title.trim(),
    courseCode: form.courseCode.trim() || undefined,
    studentId: form.studentId.trim(),
  };
  const tid = form.teacherId.trim();
  if (tid) body.teacherId = tid;
  if (form.examDateLocal) {
    const iso = new Date(form.examDateLocal).toISOString();
    body.examDate = iso;
  }
  if (form.maxScore !== "" && form.maxScore != null) {
    const n = Number(form.maxScore);
    if (!Number.isNaN(n)) body.maxScore = n;
  }
  if (form.score !== "" && form.score != null) {
    const n = Number(form.score);
    if (!Number.isNaN(n)) body.score = n;
  }
  return body;
}

export function ExamsView() {
  const [list, setList] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [details, setDetails] = useState({});
  const [detailsLoading, setDetailsLoading] = useState({});

  const loadRefs = useCallback(async () => {
    const [s, t] = await Promise.all([
      getJson(paths.students()).catch(() => []),
      getJson(paths.teachers()).catch(() => []),
    ]);
    setStudents(Array.isArray(s) ? s : []);
    setTeachers(Array.isArray(t) ? t : []);
  }, []);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [exams] = await Promise.all([
        getJson(paths.exams()),
        loadRefs().catch(() => {}),
      ]);
      setList(Array.isArray(exams) ? exams : []);
    } catch (e) {
      setError(e.message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [loadRefs]);

  useEffect(() => {
    const t = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(t);
  }, [load]);

  function startEdit(x) {
    setEditingId(pickId(x));
    setForm({
      examId: x.examId ?? "",
      title: x.title ?? "",
      courseCode: x.courseCode ?? "",
      studentId: x.studentId ?? "",
      teacherId: x.teacherId ?? "",
      examDateLocal: toDateTimeLocal(x.examDate),
      maxScore: x.maxScore != null && x.maxScore !== "" ? String(x.maxScore) : "",
      score: x.score != null && x.score !== "" ? String(x.score) : "",
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
    const body = buildExamBody(form);
    try {
      if (editingId) {
        await putJson(paths.examById(editingId), body);
        cancelEdit();
      } else {
        await postJson(paths.exams(), body);
        setForm(empty);
      }
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(x) {
    if (!window.confirm("Delete this exam?")) return;
    setBusy(true);
    setError(null);
    try {
      await deleteJson(paths.examById(pickId(x)));
      if (editingId && pickId(x) === editingId) cancelEdit();
      setDetails((d) => {
        const n = { ...d };
        delete n[pickId(x)];
        return n;
      });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function loadDetails(x) {
    const id = pickId(x);
    if (details[id]) {
      setDetails((d) => {
        const n = { ...d };
        delete n[id];
        return n;
      });
      return;
    }
    setDetailsLoading((m) => ({ ...m, [id]: true }));
    setError(null);
    try {
      const data = await getJson(paths.examWithParticipants(id));
      setDetails((d) => ({ ...d, [id]: data }));
    } catch (e) {
      setError(e.message);
    } finally {
      setDetailsLoading((m) => ({ ...m, [id]: false }));
    }
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Exams</h2>
        <button type="button" className="btn secondary" onClick={load} disabled={loading || busy}>
          Refresh
        </button>
      </div>
      {error && <p className="msg error">{error}</p>}

      <form className="form-grid" onSubmit={handleSubmit}>
        <h3 className="form-title">{editingId ? "Edit exam" : "Add exam"}</h3>
        <label>
          <span>Exam ID *</span>
          <input
            required
            value={form.examId}
            disabled={!!editingId}
            onChange={(e) => setForm((f) => ({ ...f, examId: e.target.value }))}
            placeholder="E001"
          />
        </label>
        <label className="span-2">
          <span>Title *</span>
          <input
            required
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
        </label>
        <label>
          <span>Course code</span>
          <input
            value={form.courseCode}
            onChange={(e) => setForm((f) => ({ ...f, courseCode: e.target.value }))}
            placeholder="IT4130"
          />
        </label>
        <label>
          <span>Student ID *</span>
          <div className="input-row">
            <input
              required
              value={form.studentId}
              onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))}
              list="student-ids"
              placeholder="S001"
            />
            <select
              className="companion-select"
              aria-label="Pick student from list"
              value=""
              onChange={(e) => {
                const v = e.target.value;
                if (v) setForm((f) => ({ ...f, studentId: v }));
                e.target.value = "";
              }}
            >
              <option value="">Pick…</option>
              {students.map((s) => (
                <option key={s._id || s.studentId} value={s.studentId}>
                  {s.studentId} — {s.name}
                </option>
              ))}
            </select>
          </div>
        </label>
        <label>
          <span>Teacher ID</span>
          <div className="input-row">
            <input
              value={form.teacherId}
              onChange={(e) => setForm((f) => ({ ...f, teacherId: e.target.value }))}
              list="teacher-ids"
              placeholder="T001 (optional)"
            />
            <select
              className="companion-select"
              aria-label="Pick teacher from list"
              value=""
              onChange={(e) => {
                const v = e.target.value;
                if (v) setForm((f) => ({ ...f, teacherId: v }));
                e.target.value = "";
              }}
            >
              <option value="">Pick…</option>
              {teachers.map((t) => (
                <option key={t._id || t.teacherId} value={t.teacherId}>
                  {t.teacherId} — {t.name}
                </option>
              ))}
            </select>
          </div>
        </label>
        <label>
          <span>Exam date &amp; time</span>
          <input
            type="datetime-local"
            value={form.examDateLocal}
            onChange={(e) => setForm((f) => ({ ...f, examDateLocal: e.target.value }))}
          />
        </label>
        <label>
          <span>Max score</span>
          <input
            type="number"
            min={0}
            value={form.maxScore}
            onChange={(e) => setForm((f) => ({ ...f, maxScore: e.target.value }))}
            placeholder="100"
          />
        </label>
        <label>
          <span>Score</span>
          <input
            type="number"
            min={0}
            value={form.score}
            onChange={(e) => setForm((f) => ({ ...f, score: e.target.value }))}
            placeholder="85"
          />
        </label>
        <datalist id="student-ids">
          {students.map((s) => (
            <option key={s._id || s.studentId} value={s.studentId} />
          ))}
        </datalist>
        <datalist id="teacher-ids">
          {teachers.map((t) => (
            <option key={t._id || t.teacherId} value={t.teacherId} />
          ))}
        </datalist>
        <div className="form-actions span-2">
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
                <th>Exam ID</th>
                <th>Title</th>
                <th>Course</th>
                <th>Student</th>
                <th>Teacher</th>
                <th>When</th>
                <th>Max / Score</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr>
                  <td colSpan={8} className="muted">
                    No exams yet.
                  </td>
                </tr>
              )}
              {list.map((x) => {
                const id = pickId(x);
                const when = x.examDate
                  ? new Date(x.examDate).toLocaleString()
                  : "—";
                return (
                  <Fragment key={id}>
                    <tr>
                      <td>{x.examId}</td>
                      <td>{x.title}</td>
                      <td>{x.courseCode || "—"}</td>
                      <td>{x.studentId}</td>
                      <td>{x.teacherId || "—"}</td>
                      <td>{when}</td>
                      <td>
                        {x.maxScore != null ? x.maxScore : "—"} / {x.score != null ? x.score : "—"}
                      </td>
                      <td className="row-actions col-stack">
                        <button
                          type="button"
                          className="link-btn"
                          onClick={() => startEdit(x)}
                          disabled={busy}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="link-btn"
                          onClick={() => loadDetails(x)}
                          disabled={busy || detailsLoading[id]}
                        >
                          {details[id] ? "Hide details" : "With participants"}
                        </button>
                        <button
                          type="button"
                          className="link-btn danger"
                          onClick={() => handleDelete(x)}
                          disabled={busy}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                    {details[id] && (
                      <tr className="detail-row">
                        <td colSpan={8}>
                          <pre className="json-box">{JSON.stringify(details[id], null, 2)}</pre>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
