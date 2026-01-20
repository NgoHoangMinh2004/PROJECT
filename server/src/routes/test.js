const express = require('express');
const router = express.Router();

const {
    getTests,
    createTest,
    getTestById,
    updateTest,
    deleteTest,
    getPlacementTest
} = require('../controllers/testController');

// 1. Lấy danh sách (GET /tests)
router.get('/', getTests);

// 2. Thêm mới (POST /tests/add)
router.post('/add', createTest);

// 3. Lấy chi tiết (GET /tests/edit/:id)
router.get('/edit/:id', getTestById);

// 4. Cập nhật (post /tests/edit/:id)
router.post('/edit/:id', updateTest);

// 5. Xóa (DELETE /tests/delete/:id)
router.delete('/delete/:id', deleteTest);

router.get('/placement/:difficultyId', getPlacementTest);

module.exports = router;