const express = require('express');
const router = express.Router();
const { getLearningPath, getExercisesByLesson } = require('../controllers/learningController');
const verifyToken = require('../middleware/auth');

router.get('/path', verifyToken, getLearningPath);

router.get('/exercises/:lessonId', verifyToken, getExercisesByLesson);

module.exports = router;