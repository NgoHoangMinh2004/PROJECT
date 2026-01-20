const express = require("express");
const router = express.Router();
const verifyToken = require('../middleware/auth');
const {
    getExercises,
    createExercise,
    getExerciseById,
    editExercise, // Giữ nguyên tên hàm theo ý bạn
    deleteExercise,
} = require("../controllers/ExercisesController");

router.get("/", getExercises);
router.post("/add", createExercise);
router.get("/:id", getExerciseById);
router.post("/edit/:id", editExercise);
router.delete("/delete/:id", deleteExercise);

module.exports = router;