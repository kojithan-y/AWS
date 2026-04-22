const express = require('express');
const { body, param, validationResult } = require('express-validator');
const store = require('../store/examStore');
const integration = require('../services/integrationClient');

const router = express.Router();

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

const teacherIdParam = param('teacherId')
  .trim()
  .isLength({ min: 3, max: 32 })
  .matches(/^[A-Za-z0-9_-]+$/);

const studentIdParam = param('studentId')
  .trim()
  .isLength({ min: 3, max: 32 })
  .matches(/^[A-Za-z0-9_-]+$/);

router.get(
  '/teacher/:teacherId',
  teacherIdParam,
  handleValidation,
  async (req, res, next) => {
    try {
      const exams = await store.listExamsByTeacherId(req.params.teacherId);
      res.json({ exams });
    } catch (e) {
      next(e);
    }
  },
);

router.get(
  '/student/:studentId',
  studentIdParam,
  handleValidation,
  async (req, res, next) => {
    try {
      const exams = await store.listExamsByStudentId(req.params.studentId);
      res.json({ exams });
    } catch (e) {
      next(e);
    }
  },
);

router.get('/', async (req, res, next) => {
  try {
    const exams = await store.listExams();
    res.json({ exams });
  } catch (e) {
    next(e);
  }
});

router.post(
  '/',
  [
    body('examId').trim().isLength({ min: 3, max: 32 }).matches(/^[A-Za-z0-9_-]+$/),
    body('title').trim().isLength({ min: 2, max: 200 }),
    body('courseCode').trim().isLength({ min: 2, max: 32 }),
    body('teacherId').trim().isLength({ min: 3, max: 32 }).matches(/^[A-Za-z0-9_-]+$/),
    body('enrolledStudentIds').optional().isArray(),
    body('enrolledStudentIds.*').optional().trim().isLength({ min: 3, max: 32 }).matches(/^[A-Za-z0-9_-]+$/),
    body('scheduledAt').trim().isISO8601(),
    body('venue').optional({ values: 'null' }).trim().isLength({ min: 0, max: 120 }),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      if (await store.findByExamId(req.body.examId)) {
        return res.status(409).json({ error: 'examId already registered' });
      }
      const created = await store.createExam(req.body);
      return res.status(201).json(created);
    } catch (e) {
      next(e);
    }
  },
);

router.get(
  '/:id/summary',
  param('id').isUUID(),
  handleValidation,
  async (req, res, next) => {
    try {
      const exam = await store.getExamById(req.params.id);
      if (!exam) return res.status(404).json({ error: 'Exam not found' });

      const teacherUrl = process.env.TEACHER_SERVICE_URL || '';
      const studentUrl = process.env.STUDENT_SERVICE_URL || '';
      const demoTeacherUuid = process.env.DEMO_TEACHER_UUID || '';
      const demoStudentUuid = process.env.DEMO_STUDENT_UUID || '';

      const [teacherHealth, teacherDemo, studentHealth, studentDemo] = await Promise.all([
        integration.getTeacherServiceHealth(teacherUrl),
        demoTeacherUuid
          ? integration.getTeacherByUuid(teacherUrl, demoTeacherUuid)
          : Promise.resolve({ skipped: true }),
        integration.getStudentServiceHealth(studentUrl),
        demoStudentUuid
          ? integration.getStudentByUuid(studentUrl, demoStudentUuid)
          : Promise.resolve({ skipped: true }),
      ]);

      res.json({
        exam,
        integrations: {
          teacherService: {
            configured: Boolean(teacherUrl),
            health: teacherHealth.ok ? teacherHealth.body : { status: 'unavailable', detail: teacherHealth },
            demoTeacher: demoTeacherUuid
              ? teacherDemo.ok
                ? teacherDemo.body
                : teacherDemo.skipped
                  ? null
                  : { status: 'unavailable', detail: teacherDemo }
              : null,
          },
          studentService: {
            configured: Boolean(studentUrl),
            health: studentHealth.ok ? studentHealth.body : { status: 'unavailable', detail: studentHealth },
            demoStudent: demoStudentUuid
              ? studentDemo.ok
                ? studentDemo.body
                : studentDemo.skipped
                  ? null
                  : { status: 'unavailable', detail: studentDemo }
              : null,
          },
        },
      });
    } catch (e) {
      next(e);
    }
  },
);

router.get(
  '/:id',
  param('id').isUUID(),
  handleValidation,
  async (req, res, next) => {
    try {
      const exam = await store.getExamById(req.params.id);
      if (!exam) return res.status(404).json({ error: 'Exam not found' });
      return res.json(exam);
    } catch (e) {
      next(e);
    }
  },
);

router.put(
  '/:id',
  param('id').isUUID(),
  [
    body('examId').optional().trim().isLength({ min: 3, max: 32 }).matches(/^[A-Za-z0-9_-]+$/),
    body('title').optional().trim().isLength({ min: 2, max: 200 }),
    body('courseCode').optional().trim().isLength({ min: 2, max: 32 }),
    body('teacherId').optional().trim().isLength({ min: 3, max: 32 }).matches(/^[A-Za-z0-9_-]+$/),
    body('enrolledStudentIds').optional().isArray(),
    body('enrolledStudentIds.*').optional().trim().isLength({ min: 3, max: 32 }).matches(/^[A-Za-z0-9_-]+$/),
    body('scheduledAt').optional().trim().isISO8601(),
    body('venue').optional({ values: 'null' }).trim().isLength({ min: 0, max: 120 }),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      const existing = await store.getExamById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Exam not found' });
      if (req.body.examId && req.body.examId !== existing.examId) {
        const clash = await store.findByExamId(req.body.examId);
        if (clash && clash.id !== existing.id) {
          return res.status(409).json({ error: 'examId already registered' });
        }
      }
      const updated = await store.updateExam(req.params.id, req.body);
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
      const ok = await store.deleteExam(req.params.id);
      if (!ok) return res.status(404).json({ error: 'Exam not found' });
      return res.status(204).send();
    } catch (e) {
      next(e);
    }
  },
);

module.exports = router;
