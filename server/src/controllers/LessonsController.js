const { sql, poolPromise } = require("../config/database");

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
        const { CourseID, Title, TheoryContent, LearningGoal } = req.body;

        const pool = await poolPromise;

        // BƯỚC 1: Tìm số thứ tự (OrderIndex) lớn nhất hiện tại của khóa học này
        // (Để tự động +1, tránh bị trùng lặp)
        const maxOrderQuery = await pool.request()
            .input('CourseID', sql.Int, CourseID)
            .query(`
                SELECT ISNULL(MAX(OrderIndex), 0) AS MaxOrder 
                FROM Lessons 
                WHERE CourseID = @CourseID
            `);

        const nextOrderIndex = maxOrderQuery.recordset[0].MaxOrder + 1;

        // BƯỚC 2: Thêm bài học với OrderIndex tự động
        await pool.request()
            .input('CourseID', sql.Int, CourseID)
            .input('Title', sql.NVarChar, Title)
            .input('TheoryContent', sql.NVarChar, TheoryContent)
            .input('LearningGoal', sql.NVarChar, LearningGoal)
            .input('OrderIndex', sql.Int, nextOrderIndex) // Dùng số vừa tính được
            .query(`
                INSERT INTO Lessons (CourseID, Title, TheoryContent, LearningGoal, OrderIndex)
                VALUES (@CourseID, @Title, @TheoryContent, @LearningGoal, @OrderIndex)
            `);

        res.json({ success: true, message: "Thêm bài học thành công!", newOrderIndex: nextOrderIndex });

    } catch (error) {
        console.error("Lỗi thêm bài học:", error);
        res.status(500).json({ message: "Lỗi server khi thêm bài học", error: error.message });
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