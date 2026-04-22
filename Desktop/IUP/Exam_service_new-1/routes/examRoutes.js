const express = require('express');
const router = express.Router();
const {
  createExam,
  getAllExams,
  getExamById,
  updateExam,
  deleteExam,
  getExamsByStudentId,
  getExamWithParticipants,
} = require('../controllers/examController');

/**
 * @swagger
 * tags:
 *   name: Exams
 *   description: Exam records with Student and Teacher microservice integration
 */

/**
 * @swagger
 * /api/exams:
 *   post:
 *     summary: Create an exam (validates student / teacher against other services when URLs are set)
 *     tags: [Exams]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Exam'
 *     responses:
 *       201:
 *         description: Exam created
 *       400:
 *         description: Validation or referenced entity not found
 */
router.post('/', createExam);

/**
 * @swagger
 * /api/exams:
 *   get:
 *     summary: List all exams
 *     tags: [Exams]
 */
router.get('/', getAllExams);

/**
 * @swagger
 * /api/exams/student/{studentId}:
 *   get:
 *     summary: Exams for a student (used by Student microservice aggregation)
 *     tags: [Exams]
 */
router.get('/student/:studentId', getExamsByStudentId);

/**
 * @swagger
 * /api/exams/{id}/with-participants:
 *   get:
 *     summary: Exam plus student and teacher data from other microservices
 *     tags: [Exams]
 */
router.get('/:id/with-participants', getExamWithParticipants);

/**
 * @swagger
 * /api/exams/{id}:
 *   get:
 *     summary: Get one exam by MongoDB _id or examId
 *     tags: [Exams]
 */
router.get('/:id', getExamById);

/**
 * @swagger
 * /api/exams/{id}:
 *   put:
 *     summary: Update an exam
 *     tags: [Exams]
 */
router.put('/:id', updateExam);

/**
 * @swagger
 * /api/exams/{id}:
 *   delete:
 *     summary: Delete an exam
 *     tags: [Exams]
 */
router.delete('/:id', deleteExam);

module.exports = router;
