const { v4: uuidv4 } = require('uuid');
const Student = require('../models/Student');

function toPublic(doc) {
  if (!doc) return null;
  const plain = doc.toObject ? doc.toObject({ versionKey: false }) : doc;
  const { _id, ...rest } = plain;
  return { id: _id, ...rest };
}

function mapDuplicateError(err) {
  if (err.code !== 11000) return null;
  const key = err.keyPattern && Object.keys(err.keyPattern)[0];
  if (key === 'studentId') {
    const e = new Error('studentId already registered');
    e.status = 409;
    return e;
  }
  if (key === 'email') {
    const e = new Error('email already registered');
    e.status = 409;
    return e;
  }
  const e = new Error('duplicate key');
  e.status = 409;
  return e;
}

async function listStudents() {
  const rows = await Student.find({}).sort({ createdAt: 1 }).lean();
  return rows.map((row) => toPublic(row));
}

async function getStudentById(id) {
  const row = await Student.findById(id).lean();
  return toPublic(row);
}

async function createStudent(payload) {
  const id = uuidv4();
  const record = {
    _id: id,
    studentId: payload.studentId.trim(),
    fullName: payload.fullName.trim(),
    email: payload.email.trim().toLowerCase(),
    programme: payload.programme.trim(),
    createdAt: new Date().toISOString(),
  };
  try {
    const created = await Student.create(record);
    return toPublic(created);
  } catch (err) {
    const mapped = mapDuplicateError(err);
    if (mapped) throw mapped;
    throw err;
  }
}

async function updateStudent(id, payload) {
  const existing = await getStudentById(id);
  if (!existing) return null;
  const updatedDoc = {
    _id: existing.id,
    studentId: payload.studentId !== undefined ? String(payload.studentId).trim() : existing.studentId,
    fullName: payload.fullName !== undefined ? String(payload.fullName).trim() : existing.fullName,
    email: payload.email !== undefined ? String(payload.email).trim().toLowerCase() : existing.email,
    programme: payload.programme !== undefined ? String(payload.programme).trim() : existing.programme,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };
  try {
    const doc = await Student.findOneAndReplace({ _id: id }, updatedDoc, {
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

async function deleteStudent(id) {
  const result = await Student.deleteOne({ _id: id });
  return result.deletedCount === 1;
}

async function findByStudentId(studentId) {
  const sid = String(studentId).trim();
  const row = await Student.findOne({ studentId: sid }).lean();
  return toPublic(row);
}

async function findByEmail(email) {
  const e = String(email).trim().toLowerCase();
  const row = await Student.findOne({ email: e }).lean();
  return toPublic(row);
}

module.exports = {
  listStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  findByStudentId,
  findByEmail,
};
