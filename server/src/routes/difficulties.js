const express = require("express");
const router = express.Router();
const {
    getDifficulties,
    addDifficulty,
    getDifficultyById,
    editDifficulty,
    delDifficulty } = require("../controllers/DifficultiesController");

router.get("/", getDifficulties);
router.post("/add", addDifficulty);
router.get("/edit/:DifficultyID", getDifficultyById);
router.post("/edit/:DifficultyID", editDifficulty);
router.delete("/delete/:DifficultyID", delDifficulty);

module.exports = router;
