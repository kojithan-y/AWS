const express = require('express');
const { body, param, validationResult } = require('express-validator');
const store = require('../store/studentStore');
const integration = require('../services/integrationClient');

const router = express.Router();

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

router.get('/', async (req, res, next) => {
  try {
    const students = await store.listStudents();
    res.json({ students });
  } catch (e) {
    next(e);
  }
});

router.get(
  '/:id',
  param('id').isUUID(),
  handleValidation,
  async (req, res, next) => {
    try {
      const s = await store.getStudentById(req.params.id);
      if (!s) return res.status(404).json({ error: 'Student not found' });
      return res.json(s);
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  '/',
  [
    body('studentId').trim().isLength({ min: 3, max: 32 }).matches(/^[A-Za-z0-9_-]+$/),
    body('fullName').trim().isLength({ min: 2, max: 120 }),
    body('email').trim().isEmail().normalizeEmail(),
    body('programme').trim().isLength({ min: 2, max: 80 }),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      if (await store.findByStudentId(req.body.studentId)) {
        return res.status(409).json({ error: 'studentId already registered' });
      }
      if (await store.findByEmail(req.body.email)) {
        return res.status(409).json({ error: 'email already registered' });
      }
      const created = await store.createStudent(req.body);
      return res.status(201).json(created);
    } catch (e) {
      next(e);
    }
  },
);

router.put(
  '/:id',
  param('id').isUUID(),
  [
    body('studentId').optional().trim().isLength({ min: 3, max: 32 }).matches(/^[A-Za-z0-9_-]+$/),
    body('fullName').optional().trim().isLength({ min: 2, max: 120 }),
    body('email').optional().trim().isEmail().normalizeEmail(),
    body('programme').optional().trim().isLength({ min: 2, max: 80 }),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      const existing = await store.getStudentById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Student not found' });
      if (req.body.studentId && req.body.studentId !== existing.studentId) {
        const clash = await store.findByStudentId(req.body.studentId);
        if (clash && clash.id !== existing.id) {
          return res.status(409).json({ error: 'studentId already registered' });
        }
      }
      if (req.body.email && req.body.email !== existing.email) {
        const clash = await store.findByEmail(req.body.email);
        if (clash && clash.id !== existing.id) {
          return res.status(409).json({ error: 'email already registered' });
        }
      }
      const updated = await store.updateStudent(req.params.id, req.body);
      return res.json(updated);
    } catch (e) {
      next(e);
    }
  },
);

router.delete(
  '/:id',
  param('id').isUUID(),
  handleValidation,
  async (req, res, next) => {
    try {
      const ok = await store.deleteStudent(req.params.id);
      if (!ok) return res.status(404).json({ error: 'Student not found' });
      return res.status(204).send();
    } catch (e) {
      next(e);
    }
  },
);

/**
 * Integration demo: student profile + optional calls to Exam and Teacher services.
 * Configure EXAM_SERVICE_URL and TEACHER_SERVICE_URL in deployment.
 */
router.get(
  '/:id/summary',
  param('id').isUUID(),
  handleValidation,
  async (req, res, next) => {
    try {
      const student = await store.getStudentById(req.params.id);
      if (!student) return res.status(404).json({ error: 'Student not found' });

      const examUrl = process.env.EXAM_SERVICE_URL || '';
      const teacherUrl = process.env.TEACHER_SERVICE_URL || '';

      const [examHealth, examsForStudent, teacherSample] = await Promise.all([
        integration.getExamServiceHealth(examUrl),
        integration.getExamsForStudent(examUrl, student.studentId),
        process.env.DEMO_TEACHER_ID
          ? integration.getTeacherById(teacherUrl, process.env.DEMO_TEACHER_ID)
          : Promise.resolve({ skipped: true }),
      ]);

      res.json({
        student,
        integrations: {
          examService: {
            configured: Boolean(examUrl),
            health: examHealth.ok ? examHealth.body : { status: 'unavailable', detail: examHealth },
            examsForStudent: examsForStudent.ok ? examsForStudent.body : { status: 'unavailable', detail: examsForStudent },
          },
          teacherService: {
            configured: Boolean(teacherUrl),
            demoTeacherId: process.env.DEMO_TEACHER_ID || null,
            teacher: teacherSample.ok ? teacherSample.body : teacherSample.skipped ? null : { status: 'unavailable', detail: teacherSample },
          },
        },
      });
    } catch (e) {
      next(e);
    }
  },
);

module.exports = router;
