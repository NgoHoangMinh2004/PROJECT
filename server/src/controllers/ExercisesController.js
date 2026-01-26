const { poolPromise } = require("../config/database");
const sql = require('mssql'); // QUAN TRỌNG: Phải có dòng này để dùng sql.Int, sql.NVarChar

// ===== 1. GET: Lấy toàn bộ danh sách Bài tập =====
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

// ===== 2. POST: Thêm mới Bài tập (Đã thêm A, B, C, D, CorrectAnswer) =====
const createExercise = async (req, res) => {
    try {
        // Lấy đủ dữ liệu từ Body
        const { LessonID, ExerciseType, Question, OptionA, OptionB, OptionC, OptionD, CorrectAnswer } = req.body;
        const pool = await poolPromise;

        await pool.request()
            .input('LessonID', sql.Int, LessonID)
            .input('ExerciseType', sql.NVarChar, ExerciseType)
            .input('Question', sql.NVarChar, Question)
            .input('OptionA', sql.NVarChar, OptionA)
            .input('OptionB', sql.NVarChar, OptionB)
            .input('OptionC', sql.NVarChar, OptionC)
            .input('OptionD', sql.NVarChar, OptionD)
            .input('CorrectAnswer', sql.VarChar, CorrectAnswer) // Đáp án thường là 'A', 'B'... dùng VarChar đủ rồi
            .query(`
                INSERT INTO Exercises (LessonID, ExerciseType, Question, OptionA, OptionB, OptionC, OptionD, CorrectAnswer)
                VALUES (@LessonID, @ExerciseType, @Question, @OptionA, @OptionB, @OptionC, @OptionD, @CorrectAnswer)
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
            .input('id', sql.Int, id)
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

// ===== 4. PUT: Sửa bài tập (Đã thêm A, B, C, D, CorrectAnswer) =====
const editExercise = async (req, res) => {
    try {
        const { id } = req.params;
        // Lấy đủ các trường cần update
        const { LessonID, ExerciseType, Question, OptionA, OptionB, OptionC, OptionD, CorrectAnswer } = req.body;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('LessonID', sql.Int, LessonID)
            .input('ExerciseType', sql.NVarChar, ExerciseType)
            .input('Question', sql.NVarChar, Question)
            .input('OptionA', sql.NVarChar, OptionA)
            .input('OptionB', sql.NVarChar, OptionB)
            .input('OptionC', sql.NVarChar, OptionC)
            .input('OptionD', sql.NVarChar, OptionD)
            .input('CorrectAnswer', sql.VarChar, CorrectAnswer)
            .query(`
                UPDATE Exercises 
                SET 
                    LessonID = @LessonID, 
                    ExerciseType = @ExerciseType, 
                    Question = @Question,
                    OptionA = @OptionA,
                    OptionB = @OptionB,
                    OptionC = @OptionC,
                    OptionD = @OptionD,
                    CorrectAnswer = @CorrectAnswer
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
            .input('id', sql.Int, id)
            .query('DELETE FROM Exercises WHERE ExerciseID = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: "Không tìm thấy bài tập để xóa" });
        }
        res.status(200).json({ message: "Xóa bài tập thành công" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi xóa bài tập", error: err.message });
    }
};

// ===== 6. SUBMIT: Nộp bài (Đã fix lỗi CurrentDifficulty) =====
const submitExercise = async (req, res) => {
    const { userId, lessonId, courseId, orderIndex } = req.body;

    try {
        const pool = await poolPromise;

        // 1. Đánh dấu bài học hiện tại đã HOÀN THÀNH
        // (Thêm CurrentDifficulty vào INSERT để tránh lỗi DB)
        await pool.request()
            .input('userId', sql.Int, userId)
            .input('lessonId', sql.Int, lessonId)
            .query(`
                IF EXISTS (SELECT 1 FROM UserLessonProgress WHERE UserID = @userId AND LessonID = @lessonId)
                    UPDATE UserLessonProgress SET IsCompleted = 1 WHERE UserID = @userId AND LessonID = @lessonId
                ELSE
                    INSERT INTO UserLessonProgress (UserID, LessonID, Unlocked, IsCompleted, CurrentDifficulty) 
                    VALUES (@userId, @lessonId, 1, 1, 1)
            `);

        // 2. Tìm bài học tiếp theo
        const nextLessonRes = await pool.request()
            .input('courseId', sql.Int, courseId)
            .input('currentIndex', sql.Int, orderIndex)
            .query(`
                SELECT TOP 1 LessonID FROM Lessons 
                WHERE CourseID = @courseId AND OrderIndex > @currentIndex 
                ORDER BY OrderIndex ASC
            `);

        if (nextLessonRes.recordset.length > 0) {
            const nextId = nextLessonRes.recordset[0].LessonID;

            // 3. Mở khóa bài tiếp theo
            // (Thêm CurrentDifficulty vào INSERT để tránh lỗi DB)
            await pool.request()
                .input('userId', sql.Int, userId)
                .input('nextId', sql.Int, nextId)
                .query(`
                    IF NOT EXISTS (SELECT 1 FROM UserLessonProgress WHERE UserID = @userId AND LessonID = @nextId)
                        INSERT INTO UserLessonProgress (UserID, LessonID, Unlocked, IsCompleted, CurrentDifficulty) 
                        VALUES (@userId, @nextId, 1, 0, 1)
                    ELSE
                        UPDATE UserLessonProgress SET Unlocked = 1 WHERE UserID = @userId AND LessonID = @nextId
                `);
        }

        res.json({ success: true, message: "Bài học đã hoàn thành. Bài tiếp theo đã được mở khóa!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi xử lý tiến độ bài học", error: err.message });
    }
};

module.exports = {
    getExercises,
    createExercise,
    getExerciseById,
    editExercise,
    deleteExercise,
    submitExercise
};