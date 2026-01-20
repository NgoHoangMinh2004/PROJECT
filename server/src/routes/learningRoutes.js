const express = require('express');
const router = express.Router();
const learningController = require('../controllers/learningController');
const verifyToken = require('../middleware/auth'); // Middleware xác thực

// Lấy lộ trình: /learning/path
router.get('/path', verifyToken, learningController.getLearningPath);

// Lấy bài tập theo bài học: /learning/exercises/:lessonId
router.get('/exercises/:lessonId', verifyToken, learningController.getExercisesByLesson);

module.exports = router;