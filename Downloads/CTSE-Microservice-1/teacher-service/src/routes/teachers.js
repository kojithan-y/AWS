const express = require('express');
const { body, param, validationResult } = require('express-validator');
const store = require('../store/teacherStore');
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
    const teachers = await store.listTeachers();
    res.json({ teachers });
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
      const t = await store.getTeacherById(req.params.id);
      if (!t) return res.status(404).json({ error: 'Teacher not found' });
      return res.json(t);
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  '/',
  [
    body('teacherId').trim().isLength({ min: 3, max: 32 }).matches(/^[A-Za-z0-9_-]+$/),
    body('fullName').trim().isLength({ min: 2, max: 120 }),
    body('email').trim().isEmail().normalizeEmail(),
    body('department').trim().isLength({ min: 2, max: 80 }),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      if (await store.findByTeacherId(req.body.teacherId)) {
        return res.status(409).json({ error: 'teacherId already registered' });
      }
      if (await store.findByEmail(req.body.email)) {
        return res.status(409).json({ error: 'email already registered' });
      }
      const created = await store.createTeacher(req.body);
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
    body('teacherId').optional().trim().isLength({ min: 3, max: 32 }).matches(/^[A-Za-z0-9_-]+$/),
    body('fullName').optional().trim().isLength({ min: 2, max: 120 }),
    body('email').optional().trim().isEmail().normalizeEmail(),
    body('department').optional().trim().isLength({ min: 2, max: 80 }),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      const existing = await store.getTeacherById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Teacher not found' });
      if (req.body.teacherId && req.body.teacherId !== existing.teacherId) {
        const clash = await store.findByTeacherId(req.body.teacherId);
        if (clash && clash.id !== existing.id) {
          return res.status(409).json({ error: 'teacherId already registered' });
        }
      }
      if (req.body.email && req.body.email !== existing.email) {
        const clash = await store.findByEmail(req.body.email);
        if (clash && clash.id !== existing.id) {
          return res.status(409).json({ error: 'email already registered' });
        }
      }
      const updated = await store.updateTeacher(req.params.id, req.body);
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
      const ok = await store.deleteTeacher(req.params.id);
      if (!ok) return res.status(404).json({ error: 'Teacher not found' });
      return res.status(204).send();
    } catch (e) {
      next(e);
    }
  },
);

/**
 * Integration: teacher record + Student + Exam service calls.
 */
router.get(
  '/:id/summary',
  param('id').isUUID(),
  handleValidation,
  async (req, res, next) => {
    try {
      const teacher = await store.getTeacherById(req.params.id);
      if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

      const studentUrl = process.env.STUDENT_SERVICE_URL || '';
      const examUrl = process.env.EXAM_SERVICE_URL || '';
      const demoStudentUuid = process.env.DEMO_STUDENT_UUID || '';

      const [studentHealth, studentDetail, examHealth, examsForTeacher] = await Promise.all([
        integration.getStudentServiceHealth(studentUrl),
        demoStudentUuid
          ? integration.getStudentById(studentUrl, demoStudentUuid)
          : Promise.resolve({ skipped: true }),
        integration.getExamServiceHealth(examUrl),
        integration.getExamsForTeacher(examUrl, teacher.teacherId),
      ]);

      res.json({
        teacher,
        integrations: {
          studentService: {
            configured: Boolean(studentUrl),
            health: studentHealth.ok ? studentHealth.body : { status: 'unavailable', detail: studentHealth },
            demoStudent: demoStudentUuid
              ? studentDetail.ok
                ? studentDetail.body
                : studentDetail.skipped
                  ? null
                  : { status: 'unavailable', detail: studentDetail }
              : null,
          },
          examService: {
            configured: Boolean(examUrl),
            health: examHealth.ok ? examHealth.body : { status: 'unavailable', detail: examHealth },
            examsForTeacher: examsForTeacher.ok ? examsForTeacher.body : { status: 'unavailable', detail: examsForTeacher },
          },
        },
      });
    } catch (e) {
      next(e);
    }
  },
);

module.exports = router;
