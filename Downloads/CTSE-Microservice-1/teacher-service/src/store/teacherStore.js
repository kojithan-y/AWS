const { v4: uuidv4 } = require('uuid');
const Teacher = require('../models/Teacher');

function toPublic(doc) {
  if (!doc) return null;
  const plain = doc.toObject ? doc.toObject({ versionKey: false }) : doc;
  const { _id, ...rest } = plain;
  return { id: _id, ...rest };
}

function mapDuplicateError(err) {
  if (err.code !== 11000) return null;
  const key = err.keyPattern && Object.keys(err.keyPattern)[0];
  if (key === 'teacherId') {
    const e = new Error('teacherId already registered');
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

async function listTeachers() {
  const rows = await Teacher.find({}).sort({ createdAt: 1 }).lean();
  return rows.map((row) => toPublic(row));
}

async function getTeacherById(id) {
  const row = await Teacher.findById(id).lean();
  return toPublic(row);
}

async function createTeacher(payload) {
  const id = uuidv4();
  const record = {
    _id: id,
    teacherId: payload.teacherId.trim(),
    fullName: payload.fullName.trim(),
    email: payload.email.trim().toLowerCase(),
    department: payload.department.trim(),
    createdAt: new Date().toISOString(),
  };
  try {
    const created = await Teacher.create(record);
    return toPublic(created);
  } catch (err) {
    const mapped = mapDuplicateError(err);
    if (mapped) throw mapped;
    throw err;
  }
}

async function updateTeacher(id, payload) {
  const existing = await getTeacherById(id);
  if (!existing) return null;
  const updatedDoc = {
    _id: existing.id,
    teacherId: payload.teacherId !== undefined ? String(payload.teacherId).trim() : existing.teacherId,
    fullName: payload.fullName !== undefined ? String(payload.fullName).trim() : existing.fullName,
    email: payload.email !== undefined ? String(payload.email).trim().toLowerCase() : existing.email,
    department: payload.department !== undefined ? String(payload.department).trim() : existing.department,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };
  try {
    const doc = await Teacher.findOneAndReplace({ _id: id }, updatedDoc, {
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

async function deleteTeacher(id) {
  const result = await Teacher.deleteOne({ _id: id });
  return result.deletedCount === 1;
}

async function findByTeacherId(teacherId) {
  const tid = String(teacherId).trim();
  const row = await Teacher.findOne({ teacherId: tid }).lean();
  return toPublic(row);
}

async function findByEmail(email) {
  const e = String(email).trim().toLowerCase();
  const row = await Teacher.findOne({ email: e }).lean();
  return toPublic(row);
}

module.exports = {
  listTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  findByTeacherId,
  findByEmail,
};
