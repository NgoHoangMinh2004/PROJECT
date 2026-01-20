const { sql, poolPromise } = require("./config/database");

// ===== 1. GET: Lấy danh sách bài kiểm tra (Kèm tên bài học) =====
const getTests = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT t.*, l.Title AS LessonTitle
            FROM LessonTests t
            JOIN Lessons l ON t.LessonID = l.LessonID
        `);
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi lấy danh sách bài kiểm tra", error: err.message });
    }
};

// ===== 2. POST: Thêm bài kiểm tra mới =====
const createTest = async (req, res) => {
    try {
        const { LessonID, DifficultyLevel, Title, Description, PassScore } = req.body;

        const pool = await poolPromise;
        await pool.request()
            .input('LessonID', LessonID)
            .input('DifficultyLevel', DifficultyLevel || 1)
            .input('Title', Title)
            .input('Description', Description)
            .input('PassScore', PassScore || 50)
            .query(`
                INSERT INTO LessonTests (LessonID, DifficultyLevel, Title, Description, PassScore)
                VALUES (@LessonID, @DifficultyLevel, @Title, @Description, @PassScore)
            `);

        res.status(201).json({ message: "Thêm bài kiểm tra thành công" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi thêm bài kiểm tra", error: err.message });
    }
};

// ===== 3. GET: Lấy 1 bài kiểm tra theo ID =====
const getTestById = async (req, res) => {
    try {
        const { id } = req.params; // id lấy từ URL
        const pool = await poolPromise;

        // SỬA: Đổi TestID thành LessonTestID
        const result = await pool.request()
            .input('LessonTestID', id)
            .query('SELECT * FROM LessonTests WHERE LessonTestID = @LessonTestID');

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy bài kiểm tra" });
        }
        res.status(200).json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi lấy chi tiết bài kiểm tra", error: err.message });
    }
};

// ===== 4. PUT: Sửa bài kiểm tra =====
const updateTest = async (req, res) => {
    try {
        const { id } = req.params;
        const { LessonID, DifficultyLevel, Title, Description, PassScore } = req.body;

        const pool = await poolPromise;

        // SỬA: Đổi TestID thành LessonTestID
        const result = await pool.request()
            .input('LessonTestID', id)
            .input('LessonID', LessonID)
            .input('DifficultyLevel', DifficultyLevel)
            .input('Title', Title)
            .input('Description', Description)
            .input('PassScore', PassScore)
            .query(`
                UPDATE LessonTests SET
                    LessonID = @LessonID,
                    DifficultyLevel = @DifficultyLevel,
                    Title = @Title,
                    Description = @Description,
                    PassScore = @PassScore
                WHERE LessonTestID = @LessonTestID
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: "Không tìm thấy bài kiểm tra để sửa" });
        }
        res.status(200).json({ message: "Cập nhật bài kiểm tra thành công" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi sửa bài kiểm tra", error: err.message });
    }
};

// ===== 5. DELETE: Xóa bài kiểm tra =====
const deleteTest = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        // SỬA: Đổi TestID thành LessonTestID
        const result = await pool.request()
            .input('LessonTestID', id)
            .query('DELETE FROM LessonTests WHERE LessonTestID = @LessonTestID');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: "Không tìm thấy bài kiểm tra để xóa" });
        }
        res.status(200).json({ message: "Xóa bài kiểm tra thành công" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi xóa bài kiểm tra", error: err.message });
    }
};

const getPlacementTest = async (req, res) => {
    try {
        const { difficultyId } = req.params;
        const pool = await poolPromise;

        // Lấy ngẫu nhiên 10 câu hỏi thuộc độ khó đã chọn
        const result = await pool.request()
            .input('DifficultyID', sql.Int, difficultyId)
            .query(`
                SELECT TOP 10 QuestionID, QuestionText, OptionA, OptionB, OptionC, OptionD, CorrectAnswer 
                FROM PlacementTestQuestions 
                WHERE DifficultyID = @DifficultyID 
                ORDER BY NEWID()
            `);

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi lấy bài test đầu vào", error: err.message });
    }
};

module.exports = {
    getTests,
    createTest,
    getTestById,
    updateTest,
    deleteTest,
    getPlacementTest
};