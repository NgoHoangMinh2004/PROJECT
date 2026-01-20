const { poolPromise } = require("./config/database");
const sql = require('mssql');

// 1. Lấy lộ trình học
const getLearningPath = async (req, res) => {
    try {
        const pool = await poolPromise;
        const userId = req.user.UserID;
        const courseId = 2;

        const lessonsQuery = await pool.request()
            .input('CourseID', sql.Int, courseId)
            .query(`
                SELECT LessonID, Title, LearningGoal , OrderIndex 
                FROM Lessons 
                WHERE CourseID = @CourseID 
                ORDER BY OrderIndex ASC
            `);

        // Lấy bài đã mở khóa
        const progressQuery = await pool.request()
            .input('UserID', sql.Int, userId)
            .query(`SELECT LessonID FROM UserLessonProgress WHERE UserID = @UserID AND Unlocked = 1`);

        const allLessons = lessonsQuery.recordset;
        const unlockedLessons = progressQuery.recordset.map(item => item.LessonID);

        // Tính toán trạng thái
        const result = allLessons.map((lesson) => {
            let status = 'locked';
            if (unlockedLessons.includes(lesson.LessonID)) {
                status = 'completed';
            }
            return { ...lesson, status };
        });

        // Logic tìm bài Active:
        // Tìm bài đầu tiên chưa hoàn thành để set là active
        const firstIncomplete = result.find(l => l.status === 'locked');

        if (firstIncomplete) {
            firstIncomplete.status = 'active';
        } else if (result.length > 0 && result.every(l => l.status === 'completed')) {
            // Nếu học xong hết thì bài cuối cùng vẫn active để ôn tập
            result[result.length - 1].status = 'active';
        } else if (result.length > 0 && unlockedLessons.length === 0) {
            // Nếu chưa học bài nào cả (User mới) -> Mở bài 1
            result[0].status = 'active';
        }

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// 2. Lấy bài tập của 1 bài học (CẬP NHẬT QUERY CÓ JOIN)
const getExercisesByLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('LessonID', sql.Int, lessonId)
            .query(`
                SELECT 
                    e.ExerciseID, e.ExerciseType, e.Question, 
                    e.OptionA, e.OptionB, e.OptionC, e.OptionD, e.CorrectAnswer,
                    l.Title AS LessonTitle, 
                    l.LearningGoal
                FROM Exercises e
                JOIN Lessons l ON e.LessonID = l.LessonID
                WHERE e.LessonID = @LessonID
            `);

        res.json(result.recordset);
    } catch (error) {
        console.error("LỖI SQL CHI TIẾT:", error.message);
        res.status(500).json({ message: "Lỗi lấy bài tập", error: error.message });
    }
};

module.exports = {
    getLearningPath,
    getExercisesByLesson
};