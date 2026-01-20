const { poolPromise } = require("./config/database");

// ===== 1. GET: Lấy toàn bộ danh sách Bài tập (Kèm tên bài học) =====
const getExercises = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT e.*, l.Title AS LessonTitle
            FROM Exercises e
            JOIN Lessons l ON e.LessonID = l.LessonID
        `);
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi lấy danh sách bài tập", error: err.message });
    }
};

// ===== 2. POST: Thêm mới Bài tập =====
const createExercise = async (req, res) => {
    try {
        const { LessonID, ExerciseType, Question } = req.body;
        const pool = await poolPromise;

        await pool.request()
            .input('LessonID', LessonID)
            .input('ExerciseType', ExerciseType)
            .input('Question', Question)
            .query(`
                INSERT INTO Exercises (LessonID, ExerciseType, Question)
                VALUES (@LessonID, @ExerciseType, @Question)
            `);

        res.status(201).json({ message: "Thêm bài tập thành công" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi thêm bài tập", error: err.message });
    }
};

// ===== 3. GET: Lấy 1 bài tập theo ID =====
const getExerciseById = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', id)
            .query('SELECT * FROM Exercises WHERE ExerciseID = @id');

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy bài tập" });
        }
        res.status(200).json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi lấy chi tiết bài tập", error: err.message });
    }
};

// ===== 4. PUT: Sửa bài tập =====
const editExercise = async (req, res) => {
    try {
        const { id } = req.params;
        const { LessonID, ExerciseType, Question } = req.body;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('id', id)
            .input('LessonID', LessonID)
            .input('ExerciseType', ExerciseType)
            .input('Question', Question)
            .query(`
                UPDATE Exercises 
                SET LessonID = @LessonID, ExerciseType = @ExerciseType, Question = @Question
                WHERE ExerciseID = @id
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: "Không tìm thấy bài tập để sửa" });
        }
        res.status(200).json({ message: "Cập nhật bài tập thành công" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi khi sửa bài tập", error: err.message });
    }
};

// ===== 5. DELETE: Xóa bài tập =====
const deleteExercise = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('id', id)
            .query('DELETE FROM Exercises WHERE ExerciseID = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: "Không tìm thấy bài tập để xóa" });
        }
        res.status(200).json({ message: "Xóa bài tập thành công" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi xóa bài tập. Có thể dữ liệu đang được sử dụng ở bảng khác.", error: err.message });
    }
};

module.exports = {
    getExercises,
    createExercise,
    getExerciseById,
    editExercise,
    deleteExercise
};