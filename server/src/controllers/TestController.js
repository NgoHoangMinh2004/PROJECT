const { sql, poolPromise } = require("../config/database");

// ===== 1. GET: Lấy danh sách bài kiểm tra (Kèm tên Khóa học/Level) =====
const getTests = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT t.*, c.CourseName AS LevelTitle
            FROM LessonTests t
            JOIN Courses c ON t.CourseID = c.CourseID
        `);
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi lấy danh sách bài kiểm tra", error: err.message });
    }
};

// ===== 2. POST: Thêm bài kiểm tra Level mới =====
const createTest = async (req, res) => {
    try {
        const { CourseID, DifficultyLevel, Title, Description, PassScore } = req.body;

        const pool = await poolPromise;
        await pool.request()
            .input('CourseID', sql.Int, CourseID) // Đổi sang CourseID
            .input('DifficultyLevel', sql.Int, DifficultyLevel || 1)
            .input('Title', sql.NVarChar, Title)
            .input('Description', sql.NVarChar, Description)
            .input('PassScore', sql.Float, PassScore || 50)
            .query(`
                INSERT INTO LessonTests (CourseID, DifficultyLevel, Title, Description, PassScore)
                VALUES (@CourseID, @DifficultyLevel, @Title, @Description, @PassScore)
            `);

        res.status(201).json({ message: "Thêm bài kiểm tra Level thành công" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi thêm bài kiểm tra", error: err.message });
    }
};

// ===== 3. GET: Lấy 1 bài kiểm tra theo ID =====
const getTestById = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('LessonTestID', sql.Int, id)
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
        const { CourseID, DifficultyLevel, Title, Description, PassScore } = req.body;

        const pool = await poolPromise;

        const result = await pool.request()
            .input('LessonTestID', sql.Int, id)
            .input('CourseID', sql.Int, CourseID) // Đổi sang CourseID
            .input('DifficultyLevel', sql.Int, DifficultyLevel)
            .input('Title', sql.NVarChar, Title)
            .input('Description', sql.NVarChar, Description)
            .input('PassScore', sql.Float, PassScore)
            .query(`
                UPDATE LessonTests SET
                    CourseID = @CourseID,
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

        const result = await pool.request()
            .input('LessonTestID', sql.Int, id)
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

// (Giữ nguyên logic bài test đầu vào nếu bảng PlacementTestQuestions không đổi)
const getPlacementTest = async (req, res) => {
    try {
        const { difficultyId } = req.params;
        const pool = await poolPromise;

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

const submitLevelTest = async (req, res) => {
    const { userId, courseId, score } = req.body;

    try {
        const pool = await poolPromise;

        // 1. Lấy điểm đạt (PassScore) của Level hiện tại từ bảng LessonTests
        const testReq = await pool.request()
            .input('courseId', sql.Int, courseId)
            .query('SELECT PassScore FROM LessonTests WHERE CourseID = @courseId');

        const passScore = testReq.recordset[0]?.PassScore || 70; // Mặc định 70 nếu không tìm thấy

        if (score >= passScore) {
            // 2. Tìm CourseID (Level) tiếp theo dựa theo ID tăng dần
            const nextCourseRes = await pool.request()
                .input('currentId', sql.Int, courseId)
                .query('SELECT TOP 1 CourseID FROM Courses WHERE CourseID > @currentId ORDER BY CourseID ASC');

            if (nextCourseRes.recordset.length > 0) {
                const nextCourseId = nextCourseRes.recordset[0].CourseID;

                // 3. Tìm bài học đầu tiên (OrderIndex nhỏ nhất) của Level mới đó
                const firstLessonRes = await pool.request()
                    .input('nextCourseId', sql.Int, nextCourseId)
                    .query('SELECT TOP 1 LessonID FROM Lessons WHERE CourseID = @nextCourseId ORDER BY OrderIndex ASC');

                if (firstLessonRes.recordset.length > 0) {
                    const nextLessonId = firstLessonRes.recordset[0].LessonID;

                    // 4. Cấp quyền Unlocked cho bài học đầu tiên của Level tiếp theo
                    await pool.request()
                        .input('userId', sql.Int, userId)
                        .input('lessonId', sql.Int, nextLessonId)
                        .query(`
                            IF NOT EXISTS (SELECT 1 FROM UserLessonProgress WHERE UserID = @userId AND LessonID = @lessonId)
                                INSERT INTO UserLessonProgress (UserID, LessonID, Unlocked, IsCompleted) VALUES (@userId, @lessonId, 1, 0)
                            ELSE
                                UPDATE UserLessonProgress SET Unlocked = 1 WHERE UserID = @userId AND LessonID = @lessonId
                        `);
                }
            }
            return res.json({ success: true, message: "Chúc mừng! Bạn đã vượt cấp và mở khóa Level mới." });
        }
        res.json({ success: false, message: "Bạn chưa đủ điểm để vượt qua Level này." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi hệ thống khi xử lý kết quả thi" });
    }
};

module.exports = {
    getTests,
    createTest,
    getTestById,
    updateTest,
    deleteTest,
    getPlacementTest,
    submitLevelTest
};