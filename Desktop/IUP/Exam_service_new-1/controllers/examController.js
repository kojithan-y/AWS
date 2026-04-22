const mongoose = require('mongoose');
const axios = require('axios');
const Exam = require('../models/examModel');

function buildIdFilter(param) {
  if (mongoose.Types.ObjectId.isValid(param)) {
    return { $or: [{ _id: param }, { examId: param }] };
  }
  return { examId: param };
}

async function httpGet(url) {
  try {
    const response = await axios.get(url, {
      timeout: 5000,
      validateStatus: () => true,
    });
    if (response.status >= 200 && response.status < 300) {
      return { ok: true, data: response.data };
    }
    return { ok: false, status: response.status };
  } catch {
    return { ok: false };
  }
}

/** Used on create/update when STUDENT_SERVICE_URL is set */
async function assertStudentExists(studentId) {
  const base = process.env.STUDENT_SERVICE_URL;
  if (!base) return { skip: true };
  const url = `${base.replace(/\/$/, '')}/${encodeURIComponent(studentId)}`;
  const result = await httpGet(url);
  if (!result.ok) {
    return { ok: false, message: `Student ${studentId} not found in Student service` };
  }
  return { ok: true };
}

/** Used when TEACHER_SERVICE_URL is set and teacherId is provided */
async function assertTeacherExists(teacherId) {
  const base = process.env.TEACHER_SERVICE_URL;
  if (!base) return { skip: true };
  const url = `${base.replace(/\/$/, '')}/${encodeURIComponent(teacherId)}`;
  const result = await httpGet(url);
  if (!result.ok) {
    return { ok: false, message: `Teacher ${teacherId} not found in Teacher service` };
  }
  return { ok: true };
}

exports.createExam = async (req, res) => {
  try {
    const { studentId, teacherId } = req.body;

    const studentCheck = await assertStudentExists(studentId);
    if (!studentCheck.skip && !studentCheck.ok) {
      return res.status(400).json({ message: studentCheck.message });
    }

    if (teacherId) {
      const teacherCheck = await assertTeacherExists(teacherId);
      if (!teacherCheck.skip && !teacherCheck.ok) {
        return res.status(400).json({ message: teacherCheck.message });
      }
    }

    const exam = await Exam.create(req.body);
    res.status(201).json(exam);
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'field';
      return res.status(409).json({ message: `Duplicate value for ${field}` });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getAllExams = async (req, res) => {
  try {
    const exams = await Exam.find().sort({ createdAt: -1 });
    res.status(200).json(exams);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getExamById = async (req, res) => {
  try {
    const filter = buildIdFilter(req.params.id);
    const exam = await Exam.findOne(filter);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    res.status(200).json(exam);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateExam = async (req, res) => {
  try {
    const { studentId, teacherId } = req.body;

    if (studentId !== undefined) {
      const studentCheck = await assertStudentExists(studentId);
      if (!studentCheck.skip && !studentCheck.ok) {
        return res.status(400).json({ message: studentCheck.message });
      }
    }

    if (teacherId) {
      const teacherCheck = await assertTeacherExists(teacherId);
      if (!teacherCheck.skip && !teacherCheck.ok) {
        return res.status(400).json({ message: teacherCheck.message });
      }
    }

    const filter = buildIdFilter(req.params.id);
    const exam = await Exam.findOneAndUpdate(filter, req.body, {
      new: true,
      runValidators: true,
    });
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    res.status(200).json(exam);
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'field';
      return res.status(409).json({ message: `Duplicate value for ${field}` });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteExam = async (req, res) => {
  try {
    const filter = buildIdFilter(req.params.id);
    const exam = await Exam.findOneAndDelete(filter);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    res.status(200).json({ message: 'Exam deleted', exam });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * All exam rows for a business studentId.
 * Called by the Student microservice (GET .../api/students/:id/exams).
 */
exports.getExamsByStudentId = async (req, res) => {
  try {
    const { studentId } = req.params;
    const exams = await Exam.find({ studentId }).sort({ examDate: 1, createdAt: -1 });
    res.status(200).json(exams);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * Single exam plus Student and Teacher service payloads (when URLs are configured).
 */
exports.getExamWithParticipants = async (req, res) => {
  try {
    const filter = buildIdFilter(req.params.id);
    const exam = await Exam.findOne(filter);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    let student = null;
    let teacher = null;
    const messages = [];

    const studentBase = process.env.STUDENT_SERVICE_URL;
    if (studentBase) {
      const url = `${studentBase.replace(/\/$/, '')}/${encodeURIComponent(exam.studentId)}`;
      const r = await httpGet(url);
      if (r.ok) student = r.data;
      else messages.push('Student service did not return this student');
    } else {
      messages.push('Student service URL not configured');
    }

    if (exam.teacherId) {
      const teacherBase = process.env.TEACHER_SERVICE_URL;
      if (teacherBase) {
        const url = `${teacherBase.replace(/\/$/, '')}/${encodeURIComponent(exam.teacherId)}`;
        const r = await httpGet(url);
        if (r.ok) teacher = r.data;
        else messages.push('Teacher service did not return this teacher');
      } else {
        messages.push('Teacher service URL not configured');
      }
    }

    res.status(200).json({ exam, student, teacher, messages });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
