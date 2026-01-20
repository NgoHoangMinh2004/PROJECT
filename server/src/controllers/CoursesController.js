const { poolPromise } = require("./config/database");

// ===== GET: Lấy danh sách Courses =====
const getCourses = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                c.CourseID,
                c.CourseName,
                c.Description,
                c.DifficultyID,
                d.Description AS Difficulty
            FROM Courses c
            JOIN Difficulties d ON c.DifficultyID = d.DifficultyID
        `);

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi lấy danh sách course" });
    }
};

// ===== POST: Thêm Course =====
const addCourse = async (req, res) => {
    try {
        const { DifficultyID, CourseName, Description } = req.body;
        const pool = await poolPromise;

        await pool.request()
            .input('DifficultyID', DifficultyID)
            .input('CourseName', CourseName)
            .input('Description', Description)
            .query(`
                INSERT INTO Courses (DifficultyID, CourseName, Description)
                VALUES (@DifficultyID, @CourseName, @Description)
            `);

        res.status(201).json({ message: "Thêm course thành công" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi thêm course" });
    }
};

// ===== GET: Lấy Course theo ID =====
const getCourseById = async (req, res) => {
    try {
        const { CourseID } = req.params;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('CourseID', CourseID)
            .query(`SELECT * FROM Courses WHERE CourseID=@CourseID`);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "Course không tồn tại" });
        }

        res.status(200).json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi lấy course" });
    }
};

// ===== PUT: Sửa Course =====
const editCourse = async (req, res) => {
    try {
        const { CourseID } = req.params;
        const { CourseName, Description } = req.body;
        const pool = await poolPromise;

        await pool.request()
            .input('CourseID', CourseID)
            .input('CourseName', CourseName)
            .input('Description', Description)
            .query(`
                UPDATE Courses SET
                    CourseName=@CourseName,
                    Description=@Description
                WHERE CourseID=@CourseID
            `);

        res.status(200).json({ message: "Cập nhật course thành công" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi sửa course" });
    }
};

// ===== DELETE: Xóa Course (có xóa liên kết) =====
const delCourse = async (req, res) => {
    try {
        const { CourseID } = req.params;
        const pool = await poolPromise;

        // 1. UserLessonProgress
        await pool.request()
            .input('CourseID', CourseID)
            .query(`
                DELETE ulp
                FROM UserLessonProgress ulp
                JOIN Lessons l ON ulp.LessonID = l.LessonID
                WHERE l.CourseID = @CourseID
            `);

        // 2. LessonTests
        await pool.request()
            .input('CourseID', CourseID)
            .query(`
                DELETE lt
                FROM LessonTests lt
                JOIN Lessons l ON lt.LessonID = l.LessonID
                WHERE l.CourseID = @CourseID
            `);

        // 3. Exercises
        await pool.request()
            .input('CourseID', CourseID)
            .query(`
                DELETE e
                FROM Exercises e
                JOIN Lessons l ON e.LessonID = l.LessonID
                WHERE l.CourseID = @CourseID
            `);

        // 4. Lessons
        await pool.request()
            .input('CourseID', CourseID)
            .query(`DELETE FROM Lessons WHERE CourseID=@CourseID`);

        // 5. Courses
        await pool.request()
            .input('CourseID', CourseID)
            .query(`DELETE FROM Courses WHERE CourseID=@CourseID`);

        res.status(200).json({ message: "Xóa course thành công" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi xóa course" });
    }
};

module.exports = {
    getCourses,
    addCourse,
    getCourseById,
    editCourse,
    delCourse
};
