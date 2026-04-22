const { v4: uuidv4 } = require('uuid');
const Exam = require('../models/Exam');

function toPublic(doc) {
  if (!doc) return null;
  const plain = doc.toObject ? doc.toObject({ versionKey: false }) : doc;
  const { _id, ...rest } = plain;
  return { id: _id, ...rest };
}

function mapDuplicateError(err) {
  if (err.code !== 11000) return null;
  const key = err.keyPattern && Object.keys(err.keyPattern)[0];
  if (key === 'examId') {
    const e = new Error('examId already registered');
    e.status = 409;
    return e;
  }
  const e = new Error('duplicate key');
  e.status = 409;
  return e;
}

function normalizeStudentIds(ids) {
  if (!ids) return [];
  if (!Array.isArray(ids)) return [];
  return ids.map((s) => String(s).trim()).filter(Boolean);
}

async function listExams() {
  const rows = await Exam.find({}).sort({ scheduledAt: 1 }).lean();
  return rows.map((row) => toPublic(row));
}

async function getExamById(id) {
  const row = await Exam.findById(id).lean();
  return toPublic(row);
}

async function createExam(payload) {
  const id = uuidv4();
  const enrolledStudentIds = normalizeStudentIds(payload.enrolledStudentIds);
  const record = {
    _id: id,
    examId: payload.examId.trim(),
    title: payload.title.trim(),
    courseCode: payload.courseCode.trim(),
    teacherId: payload.teacherId.trim(),
    enrolledStudentIds,
    scheduledAt: payload.scheduledAt.trim(),
    venue: payload.venue !== undefined && payload.venue !== null ? String(payload.venue).trim() : '',
    createdAt: new Date().toISOString(),
  };
  try {
    const created = await Exam.create(record);
    return toPublic(created);
  } catch (err) {
    const mapped = mapDuplicateError(err);
    if (mapped) throw mapped;
    throw err;
  }
}

async function updateExam(id, payload) {
  const existing = await getExamById(id);
  if (!existing) return null;
  const nextStudents =
    payload.enrolledStudentIds !== undefined
      ? normalizeStudentIds(payload.enrolledStudentIds)
      : existing.enrolledStudentIds || [];
  const updatedDoc = {
    _id: existing.id,
    examId: payload.examId !== undefined ? String(payload.examId).trim() : existing.examId,
    title: payload.title !== undefined ? String(payload.title).trim() : existing.title,
    courseCode: payload.courseCode !== undefined ? String(payload.courseCode).trim() : existing.courseCode,
    teacherId: payload.teacherId !== undefined ? String(payload.teacherId).trim() : existing.teacherId,
    enrolledStudentIds: nextStudents,
    scheduledAt: payload.scheduledAt !== undefined ? String(payload.scheduledAt).trim() : existing.scheduledAt,
    venue:
      payload.venue !== undefined && payload.venue !== null
        ? String(payload.venue).trim()
        : existing.venue || '',
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };
  try {
    const doc = await Exam.findOneAndReplace({ _id: id }, updatedDoc, {
      new: true,
      runValidators: true,
    }).lean();
    return toPublic(doc);
  } catch (err) {
    const mapped = mapDuplicateError(err);
    if (mapped) throw mapped;
    throw err;
  }
}

async function deleteExam(id) {
  const result = await Exam.deleteOne({ _id: id });
  return result.deletedCount === 1;
}

async function findByExamId(examId) {
  const eid = String(examId).trim();
  const row = await Exam.findOne({ examId: eid }).lean();
  return toPublic(row);
}

async function listExamsByTeacherId(teacherId) {
  const tid = String(teacherId).trim();
  const rows = await Exam.find({ teacherId: tid }).sort({ scheduledAt: 1 }).lean();
  return rows.map((row) => toPublic(row));
}

async function listExamsByStudentId(studentId) {
  const sid = String(studentId).trim();
  const rows = await Exam.find({ enrolledStudentIds: sid }).sort({ scheduledAt: 1 }).lean();
  return rows.map((row) => toPublic(row));
}

module.exports = {
  listExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  findByExamId,
  listExamsByTeacherId,
  listExamsByStudentId,
};
