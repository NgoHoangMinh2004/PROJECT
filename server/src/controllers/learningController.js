const { poolPromise } = require("../config/database");
const sql = require('mssql');

// 1. Lấy lộ trình học (Đã có fix khởi tạo)
const getLearningPath = async (req, res) => {
    try {
        const userId = req.user.UserID;
        // Ưu tiên lấy courseId từ query string nếu người dùng chọn từ Menu
        let courseId = req.query.courseId;
        const pool = await poolPromise;

        // BƯỚC 0: Nếu không có courseId truyền vào (lần đầu vào trang), mới tìm Level mới nhất
        if (!courseId) {
            const latestProgress = await pool.request()
                .input('UserID', sql.Int, userId)
                .query(`
                    SELECT TOP 1 L.CourseID 
                    FROM UserLessonProgress UP
                    JOIN Lessons L ON UP.LessonID = L.LessonID
                    WHERE UP.UserID = @UserID
                    ORDER BY L.CourseID DESC
                `);

            courseId = latestProgress.recordset.length > 0 ? latestProgress.recordset[0].CourseID : 2;
        }

        const targetCourseId = parseInt(courseId); // Ép kiểu để truy vấn chính xác

        // BƯỚC 1: TỰ ĐỘNG KHỞI TẠO BÀI ĐẦU TIÊN NẾU CHƯA CÓ TIẾN TRÌNH
        const checkProgress = await pool.request()
            .input('UserID', sql.Int, userId)
            .input('CourseID', sql.Int, targetCourseId)
            .query(`
                SELECT COUNT(*) as count 
                FROM UserLessonProgress UP
                JOIN Lessons L ON UP.LessonID = L.LessonID
                WHERE UP.UserID = @UserID AND L.CourseID = @CourseID
            `);

        if (checkProgress.recordset[0].count === 0) {
            const firstLesson = await pool.request()
                .input('CourseID', sql.Int, targetCourseId)
                .query(`SELECT TOP 1 LessonID FROM Lessons WHERE CourseID = @CourseID ORDER BY OrderIndex ASC`);

            if (firstLesson.recordset.length > 0) {
                const firstLessonID = firstLesson.recordset[0].LessonID;
                await pool.request()
                    .input('UserID', sql.Int, userId)
                    .input('LessonID', sql.Int, firstLessonID)
                    .query(`
                        INSERT INTO UserLessonProgress (UserID, LessonID, Unlocked, IsCompleted, CurrentDifficulty)
                        VALUES (@UserID, @LessonID, 1, 0, 1) 
                    `);
            }
        }

        // BƯỚC 2: LẤY LỘ TRÌNH CỦA ĐÚNG LEVEL ĐANG CHỌN
        const result = await pool.request()
            .input('UserID', sql.Int, userId)
            .input('CourseID', sql.Int, targetCourseId)
            .query(`
                SELECT L.LessonID, L.Title, L.OrderIndex, L.CourseID,
                    CASE 
                        WHEN P.IsCompleted = 1 THEN 'completed'
                        WHEN P.Unlocked = 1 THEN 'active'
                        ELSE 'locked'
                    END as status
                FROM Lessons L
                LEFT JOIN UserLessonProgress P ON L.LessonID = P.LessonID AND P.UserID = @UserID
                WHERE L.CourseID = @CourseID
                ORDER BY L.OrderIndex ASC
            `);

        const lessons = result.recordset;

        // BƯỚC 3: KIỂM TRA ĐIỀU KIỆN LÀM BÀI TEST
        const totalLessons = lessons.length;
        const completedLessons = lessons.filter(l => l.status === 'completed').length;
        const isCourseCompleted = totalLessons > 0 && totalLessons === completedLessons;

        const testInfo = await pool.request()
            .input('CourseID', sql.Int, targetCourseId)
            .query(`SELECT LessonTestID, Title FROM LessonTests WHERE CourseID = @CourseID`);

        res.json({
            lessons: lessons,
            test: testInfo.recordset.length > 0 ? testInfo.recordset[0] : null,
            canTakeTest: isCourseCompleted,
            currentCourseId: targetCourseId // Trả về ID để Frontend đồng bộ Menu
        });

    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// 2. Lấy bài tập của bài học
const getExercisesByLesson = async (req, res) => {
    try {
        // Lấy lessonId từ URL
        const { lessonId } = req.params;

        // 1. KIỂM TRA QUAN TRỌNG
        if (!lessonId || isNaN(lessonId)) {
            return res.status(400).json({ message: "Mã bài học không hợp lệ." });
        }

        // 2. Ép kiểu sang số nguyên
        const lessonIdInt = parseInt(lessonId, 10);

        const pool = await poolPromise;

        const result = await pool.request()
            .input('LessonID', sql.Int, lessonIdInt) // <--- Truyền biến đã ép kiểu
            .query(`
                SELECT 
                    e.ExerciseID, e.ExerciseType, e.Question, 
                    e.OptionA, e.OptionB, e.OptionC, e.OptionD, e.CorrectAnswer,
                    l.Title AS LessonTitle, l.LearningGoal,
                    l.CourseID, l.OrderIndex
                FROM Exercises e
                JOIN Lessons l ON e.LessonID = l.LessonID
                WHERE e.LessonID = @LessonID
            `);

        // Kiểm tra xem có dữ liệu không
        if (result.recordset.length === 0) {
            // Có thể bài học chưa có bài tập, nhưng vẫn trả về mảng rỗng để Frontend không lỗi map
            console.log("Bài học này chưa có bài tập nào.");
            return res.json([]);
        }

        res.json(result.recordset);
    } catch (error) {
        console.error("Lỗi getExercisesByLesson:", error);
        res.status(500).json({ message: "Lỗi lấy bài tập", error: error.message });
    }
};

// 3. Xử lý HOÀN THÀNH BÀI (Mở bài tiếp theo trong cùng Level)
const completeLesson = async (req, res) => {
    try {
        const { lessonId, courseId, orderIndex } = req.body;
        const userId = req.user.UserID;

        const pool = await poolPromise;

        // --- VIỆC 1: Update bài hiện tại thành ĐÃ XONG ---
        await pool.request()
            .input('UserID', sql.Int, userId)
            .input('LessonID', sql.Int, lessonId)
            .query(`
                IF EXISTS (SELECT 1 FROM UserLessonProgress WHERE UserID = @UserID AND LessonID = @LessonID)
                    UPDATE UserLessonProgress SET IsCompleted = 1 WHERE UserID = @UserID AND LessonID = @LessonID
                ELSE
                    INSERT INTO UserLessonProgress (UserID, LessonID, Unlocked, IsCompleted, CurrentDifficulty) 
                    VALUES (@UserID, @LessonID, 1, 1, 1)
            `);

        // --- VIỆC 2: Tìm bài tiếp theo trong cùng Course ---
        const nextLessonRes = await pool.request()
            .input('CourseID', sql.Int, courseId)
            .input('CurrentOrder', sql.Int, orderIndex)
            .query(`
                SELECT TOP 1 LessonID 
                FROM Lessons 
                WHERE CourseID = @CourseID AND OrderIndex > @CurrentOrder 
                ORDER BY OrderIndex ASC
            `);

        // --- VIỆC 3: Nếu tìm thấy bài tiếp theo -> Mở khóa ---
        if (nextLessonRes.recordset.length > 0) {
            const nextLessonId = nextLessonRes.recordset[0].LessonID;

            await pool.request()
                .input('UserID', sql.Int, userId)
                .input('NextID', sql.Int, nextLessonId)
                .query(`
                    IF NOT EXISTS (SELECT 1 FROM UserLessonProgress WHERE UserID = @UserID AND LessonID = @NextID)
                        INSERT INTO UserLessonProgress (UserID, LessonID, Unlocked, IsCompleted, CurrentDifficulty) 
                        VALUES (@UserID, @NextID, 1, 0, 1) -- Unlocked=1, Completed=0, Difficulty=1
                    ELSE
                        UPDATE UserLessonProgress SET Unlocked = 1 WHERE UserID = @UserID AND LessonID = @NextID
                `);

            return res.json({ success: true, message: "Đã xong bài 1, mở khóa bài 2!" });
        }

        res.json({ success: true, message: "Chúc mừng! Bạn đã hoàn thành tất cả bài học." });

    } catch (error) {
        console.error("Lỗi completeLesson:", error);
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// 4. Xử lý VƯỢT LEVEL (Mở bài đầu tiên của Level tiếp theo)
const submitLevelTest = async (req, res) => {
    try {
        const { courseId, score } = req.body;
        const userId = req.user.UserID;
        const pool = await poolPromise;

        const testReq = await pool.request()
            .input('CourseID', sql.Int, courseId)
            .query('SELECT PassScore FROM LessonTests WHERE CourseID = @CourseID');

        const passScore = testReq.recordset[0]?.PassScore || 70;

        if (score >= passScore) {
            const nextCourseRes = await pool.request()
                .input('CurrentID', sql.Int, courseId)
                .query('SELECT TOP 1 CourseID FROM Courses WHERE CourseID > @CurrentId ORDER BY CourseID ASC');

            if (nextCourseRes.recordset.length > 0) {
                const nextCourseId = nextCourseRes.recordset[0].CourseID;
                const firstLessonRes = await pool.request()
                    .input('NextCourseID', sql.Int, nextCourseId)
                    .query('SELECT TOP 1 LessonID FROM Lessons WHERE CourseID = @NextCourseID ORDER BY OrderIndex ASC');

                if (firstLessonRes.recordset.length > 0) {
                    const nextLessonId = firstLessonRes.recordset[0].LessonID;

                    // SỬA: Thêm CurrentDifficulty vào INSERT
                    await pool.request()
                        .input('UserID', sql.Int, userId)
                        .input('LessonID', sql.Int, nextLessonId)
                        .query(`
                            IF NOT EXISTS (SELECT 1 FROM UserLessonProgress WHERE UserID = @UserID AND LessonID = @LessonID)
                                INSERT INTO UserLessonProgress (UserID, LessonID, Unlocked, IsCompleted, CurrentDifficulty) 
                                VALUES (@UserID, @LessonID, 1, 0, 1)
                            ELSE
                                UPDATE UserLessonProgress SET Unlocked = 1 WHERE UserID = @UserID AND LessonID = @LessonID
                        `);
                }
            }
            return res.json({ success: true, message: "Chúc mừng! Bạn đã mở khóa Level mới." });
        }
        res.json({ success: false, message: "Bạn cần đạt điểm cao hơn để vượt cấp." });
    } catch (error) {
        res.status(500).json({ message: "Lỗi xử lý kết quả thi", error: error.message });
    }
};

const getTestContent = async (req, res) => {
    try {
        // 1. Lấy và kiểm tra TestID
        const { testId } = req.params;


        // KIỂM TRA QUAN TRỌNG:
        if (!testId || isNaN(testId)) {
            return res.status(400).json({ message: "Mã bài kiểm tra không hợp lệ." });
        }

        // Ép kiểu sang số nguyên an toàn
        const testIdInt = parseInt(testId, 10);

        const pool = await poolPromise;

        // 2. Lấy thông tin bài kiểm tra
        const testInfoRes = await pool.request()
            .input('TestID', sql.Int, testIdInt) // Truyền biến đã ép kiểu
            .query('SELECT * FROM LessonTests WHERE LessonTestID = @TestID');

        if (testInfoRes.recordset.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy bài kiểm tra" });
        }

        const testInfo = testInfoRes.recordset[0];
        const courseId = testInfo.CourseID;

        // 3. Lấy ngẫu nhiên 10 câu hỏi
        const questionsRes = await pool.request()
            .input('CourseID', sql.Int, courseId)
            .query(`
                SELECT TOP 10
                    e.ExerciseID, e.ExerciseType, e.Question, 
                    e.OptionA, e.OptionB, e.OptionC, e.OptionD, e.CorrectAnswer
                FROM Exercises e
                JOIN Lessons l ON e.LessonID = l.LessonID
                WHERE l.CourseID = @CourseID
                ORDER BY NEWID() 
            `);

        if (questionsRes.recordset.length === 0) {
            return res.status(400).json({ message: "Chưa có dữ liệu câu hỏi cho khóa học này." });
        }

        res.json({
            testInfo: testInfo,
            questions: questionsRes.recordset
        });

    } catch (error) {
        console.error("Lỗi getTestContent:", error);
        res.status(500).json({ message: "Lỗi tạo đề thi", error: error.message });
    }
};

//Danh Sach Khoa hoc da mo khoa
const getUnlockedCourses = async (req, res) => {
    try {
        const userId = req.user.UserID;
        const pool = await poolPromise;

        // Lấy danh sách các CourseID mà User đã có tiến trình (đã mở khóa)
        const result = await pool.request()
            .input('UserID', sql.Int, userId)
            .query(`
                SELECT DISTINCT C.CourseID, C.CourseName
                FROM Courses C
                JOIN Lessons L ON C.CourseID = L.CourseID
                JOIN UserLessonProgress UP ON L.LessonID = UP.LessonID
                WHERE UP.UserID = @UserID
                ORDER BY C.CourseID ASC
            `);

        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lấy danh sách level', error: error.message });
    }
};

module.exports = {
    getLearningPath,
    getExercisesByLesson,
    completeLesson,
    submitLevelTest,
    getTestContent,
    getUnlockedCourses
};