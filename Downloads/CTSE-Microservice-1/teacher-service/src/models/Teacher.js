const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  _id: { type: String },
  teacherId: { type: String, required: true, unique: true, trim: true },
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  department: { type: String, required: true, trim: true },
  createdAt: { type: String, required: true },
  updatedAt: { type: String },
});

module.exports = mongoose.model('Teacher', teacherSchema);
