const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  _id: { type: String },
  studentId: { type: String, required: true, unique: true, trim: true },
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  programme: { type: String, required: true, trim: true },
  createdAt: { type: String, required: true },
  updatedAt: { type: String },
});

module.exports = mongoose.model('Student', studentSchema);
