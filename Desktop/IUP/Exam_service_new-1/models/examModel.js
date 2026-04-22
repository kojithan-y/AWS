const mongoose = require('mongoose');

const examSchema = new mongoose.Schema(
  {
    examId: {
      type: String,
      required: [true, 'examId is required'],
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'title is required'],
      trim: true,
    },
    courseCode: {
      type: String,
      trim: true,
    },
    /** Business student id (e.g. S001) — must exist in Student service when integration is enabled */
    studentId: {
      type: String,
      required: [true, 'studentId is required'],
      trim: true,
    },
    /** Optional invigilator / course teacher business id (e.g. T001) */
    teacherId: {
      type: String,
      trim: true,
    },
    examDate: {
      type: Date,
    },
    maxScore: {
      type: Number,
      min: 0,
    },
    score: {
      type: Number,
      min: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Exam', examSchema);
