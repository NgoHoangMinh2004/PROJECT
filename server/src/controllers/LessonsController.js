const { poolPromise } = require("./config/database");

// ===== 1. Lấy danh sách Lesson (Tương tự getUsersPage nhưng trả JSON) =====
const getLessons = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                l.LessonID,
                l.CourseID,
                c.CourseName,
                l.Title,
                l.TheoryContent,
                l.LearningGoal,
                l.OrderIndex
            FROM Lessons l
            JOIN Courses c ON l.CourseID = c.CourseID
            ORDER BY l.OrderIndex ASC
        `);

        // Thay vì res.render('...'), ta trả về JSON
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// ===== 2. Thêm Lesson (Tương tự addUser) =====
const addLesson = async (req, res) => {
    try {
        // Lấy dữ liệu khớp với bảng Lessons
        const { CourseID, Title, TheoryContent, LearningGoal, OrderIndex } = req.body;

        const pool = await poolPromise;
        await pool.request()
            .input('CourseID', CourseID)
            .input('Title', Title)
            .input('TheoryContent', TheoryContent)
            .input('LearningGoal', LearningGoal)
            .input('OrderIndex', OrderIndex)
            .query(`
                INSERT INTO Lessons (CourseID, Title, TheoryContent, LearningGoal, OrderIndex)
                VALUES (@CourseID, @Title, @TheoryContent, @LearningGoal, @OrderIndex)
            `);

        // Thay vì res.redirect, ta trả về thông báo thành công
        res.status(201).json({ message: 'Thêm bài học thành công' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi thêm bài học', error: err.message });
    }
};

// ===== 3. Lấy thông tin 1 Lesson (Tương tự getEditUserpage) =====
const getLessonById = async (req, res) => {
    try {
        // userController dùng UserID, ở đây ta dùng LessonID lấy từ params
        const { LessonID } = req.params;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('LessonID', LessonID)
            .query('SELECT * FROM Lessons WHERE LessonID = @LessonID');

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy bài học' });
        }

        res.status(200).json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi khi lấy thông tin bài học' });
    }
};

// ===== 4. Sửa Lesson (Tương tự editUser) =====
const editLesson = async (req, res) => {
    try {
        const { LessonID } = req.params;
        const { CourseID, Title, TheoryContent, LearningGoal, OrderIndex } = req.body;

        const pool = await poolPromise;
        await pool.request()
            .input('LessonID', LessonID)
            .input('CourseID', CourseID)
            .input('Title', Title)
            .input('TheoryContent', TheoryContent)
            .input('LearningGoal', LearningGoal)
            .input('OrderIndex', OrderIndex)
            .query(`
                UPDATE Lessons SET
                    CourseID = @CourseID,
                    Title = @Title,
                    TheoryContent = @TheoryContent,
                    LearningGoal = @LearningGoal,
                    OrderIndex = @OrderIndex
                WHERE LessonID = @LessonID
            `);

        res.status(200).json({ message: 'Cập nhật bài học thành công' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi khi sửa bài học', error: err.message });
    }
};

// ===== 5. Xóa Lesson (Tương tự delUser) =====
const deleteLesson = async (req, res) => {
    try {
        const { LessonID } = req.params;
        const pool = await poolPromise;

        // Lưu ý: Nếu Lesson có Exercise thì lệnh này sẽ lỗi do khóa ngoại.
        // Bạn có thể cần xóa Exercise trước tương tự như cách delUser xóa UserLessonProgress.
        // Tuy nhiên code dưới đây viết đơn giản giống hệt logic delUser của bạn.

        await pool.request()
            .input('LessonID', LessonID)
            .query('DELETE FROM Lessons WHERE LessonID = @LessonID');

        res.status(200).json({ message: 'Xóa bài học thành công' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi xóa bài học (Có thể do còn bài tập con)', error: err.message });
    }
};

module.exports = {
    getLessons,
    addLesson,
    getLessonById,
    editLesson,
    deleteLesson
};