const express = require('express');
const router = express.Router();

// Import các hàm từ controller
const {
    getLessons,
    addLesson,
    getLessonById,
    editLesson,
    deleteLesson
} = require('../controllers/LessonsController');

// 1. Lấy danh sách (GET /lessons)
router.get('/', getLessons);

// 2. Thêm mới (POST /lessons/add)
router.post('/add', addLesson);

// 3. Lấy thông tin 1 bài để xem chi tiết (GET /lessons/edit/:LessonID)
router.get('/edit/:LessonID', getLessonById);

// 4. Cập nhật bài học (PUT /lessons/edit/:LessonID)
// Dùng PUT thay vì POST vì đây là API test bằng Postman
router.post('/edit/:LessonID', editLesson);

// 5. Xóa bài học (DELETE /lessons/delete/:LessonID)
router.delete('/delete/:LessonID', deleteLesson);

module.exports = router;