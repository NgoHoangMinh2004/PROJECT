const express = require('express');
const router = express.Router();

const {
    getAllProgress,
    createProgress,
    getProgressByUserId,
    updateProgress,
    deleteProgress
} = require('../controllers/ProgressController');

// 1. Lấy tất cả tiến trình (GET /progress)
router.get('/', getAllProgress);

// 2. Tạo mới tiến trình (POST /progress/add)
router.post('/add', createProgress);


router.get('/user/:UserID', getProgressByUserId);

router.post('/update', updateProgress);

// 5. Xóa tiến trình (DELETE /progress/delete/:UserID/:LessonID)

router.delete('/delete/:UserID/:LessonID', deleteProgress);

module.exports = router;