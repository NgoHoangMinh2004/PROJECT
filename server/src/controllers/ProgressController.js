const { poolPromise } = require("./config/database");

// ===== 1. GET: Lấy toàn bộ danh sách tiến trình (Kèm tên User và Tên Bài) =====
const getAllProgress = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                p.UserID,
                u.FullName,
                p.LessonID,
                l.Title AS LessonTitle,
                p.CurrentDifficulty,
                p.Unlocked
            FROM UserLessonProgress p
            JOIN Users u ON p.UserID = u.UserID
            JOIN Lessons l ON p.LessonID = l.LessonID
        `);
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi lấy danh sách tiến trình", error: err.message });
    }
};

// ===== 2. POST: Thêm mới tiến trình (Khi user bắt đầu học bài mới) =====
const createProgress = async (req, res) => {
    try {
        const { UserID, LessonID, CurrentDifficulty, Unlocked } = req.body;

        const pool = await poolPromise;
        await pool.request()
            .input('UserID', UserID)
            .input('LessonID', LessonID)
            .input('CurrentDifficulty', CurrentDifficulty || 1)
            .input('Unlocked', Unlocked ?? 1) // Mặc định là 1 (Mở khóa)
            .query(`
                INSERT INTO UserLessonProgress (UserID, LessonID, CurrentDifficulty, Unlocked)
                VALUES (@UserID, @LessonID, @CurrentDifficulty, @Unlocked)
            `);

        res.status(201).json({ message: "Thêm tiến trình thành công" });
    } catch (err) {
        console.error(err);
        // Lỗi 2627 là lỗi trùng khóa chính (User đã có tiến trình bài này rồi)
        if (err.number === 2627) {
            return res.status(400).json({ message: "User này đã có tiến trình cho bài học này rồi." });
        }
        res.status(500).json({ message: "Lỗi thêm tiến trình", error: err.message });
    }
};

// ===== 3. GET: Lấy tiến trình của MỘT User cụ thể =====
const getProgressByUserId = async (req, res) => {
    try {
        const { UserID } = req.params;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('UserID', UserID)
            .query(`
                SELECT p.*, l.Title 
                FROM UserLessonProgress p
                JOIN Lessons l ON p.LessonID = l.LessonID
                WHERE p.UserID = @UserID
            `);

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi lấy tiến trình của User", error: err.message });
    }
};

// ===== 4. PUT: Cập nhật tiến trình (VD: Học xong thì mở khóa, hoặc tăng độ khó) =====
const updateProgress = async (req, res) => {
    try {
        // Cần cả UserID và LessonID để biết sửa dòng nào
        const { UserID, LessonID, CurrentDifficulty, Unlocked } = req.body;

        const pool = await poolPromise;
        const result = await pool.request()
            .input('UserID', UserID)
            .input('LessonID', LessonID)
            .input('CurrentDifficulty', CurrentDifficulty)
            .input('Unlocked', Unlocked)
            .query(`
                UPDATE UserLessonProgress 
                SET CurrentDifficulty = @CurrentDifficulty, 
                    Unlocked = @Unlocked
                WHERE UserID = @UserID AND LessonID = @LessonID
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: "Không tìm thấy tiến trình để cập nhật (Sai UserID hoặc LessonID)" });
        }
        res.status(200).json({ message: "Cập nhật tiến trình thành công" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi cập nhật tiến trình", error: err.message });
    }
};

// ===== 5. DELETE: Xóa tiến trình =====
// Route sẽ dạng: /delete/:UserID/:LessonID
const deleteProgress = async (req, res) => {
    try {
        const { UserID, LessonID } = req.params;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('UserID', UserID)
            .input('LessonID', LessonID)
            .query('DELETE FROM UserLessonProgress WHERE UserID = @UserID AND LessonID = @LessonID');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: "Không tìm thấy tiến trình để xóa" });
        }
        res.status(200).json({ message: "Xóa tiến trình thành công" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi xóa tiến trình", error: err.message });
    }
};

module.exports = {
    getAllProgress,
    createProgress,
    getProgressByUserId,
    updateProgress,
    deleteProgress
};