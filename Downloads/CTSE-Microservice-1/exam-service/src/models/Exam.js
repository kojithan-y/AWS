const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  _id: { type: String },
  examId: { type: String, required: true, unique: true, trim: true },
  title: { type: String, required: true, trim: true },
  courseCode: { type: String, required: true, trim: true },
  teacherId: { type: String, required: true, trim: true },
  enrolledStudentIds: { type: [String], default: [] },
  scheduledAt: { type: String, required: true },
  venue: { type: String, trim: true },
  createdAt: { type: String, required: true },
  updatedAt: { type: String },
});

module.exports = mongoose.model('Exam', examSchema);
