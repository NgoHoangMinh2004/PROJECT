const express = require('express');
const router = express.Router();
const {
    getLearningPath,
    getExercisesByLesson,
    completeLesson,
    getTestContent,
    submitLevelTest,
    getUnlockedCourses
} = require('../controllers/learningController');
const verifyToken = require('../middleware/auth');

// 1. Lấy lộ trình học tập
router.get('/path', verifyToken, getLearningPath);

// 2. Lấy danh sách bài tập (ĐÃ SỬA LẠI DÒNG NÀY)
// Frontend gọi: /learning/lesson/{id}/exercises
// Nên Backend phải là: /lesson/:lessonId/exercises
router.get('/lesson/:lessonId/exercises', verifyToken, getExercisesByLesson);

// 3. Nộp bài tập thường
router.post('/complete-lesson', verifyToken, completeLesson);

// 4. Lấy đề thi 
router.get('/test-content/:testId', verifyToken, getTestContent);

// 5. Nộp bài kiểm tra 
router.post('/submit-test', verifyToken, submitLevelTest);

// 6. Lấy danh sách khóa học đã mở
router.get('/unlocked-courses', verifyToken, getUnlockedCourses);

module.exports = router;