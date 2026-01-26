const { poolPromise } = require("../config/database");

// ===== 1. GET: Lấy toàn bộ danh sách Difficulties =====
const getDifficulties = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT DifficultyID, Description
            FROM Difficulties
        `);
        // Trả về mảng dữ liệu JSON
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi lấy danh sách difficulty", error: err.message });
    }
};

// ===== 2. POST: Thêm mới Difficulty =====
const addDifficulty = async (req, res) => {
    try {
        const { Description } = req.body;
        const pool = await poolPromise;

        await pool.request()
            .input("Description", Description)
            .query(`
                INSERT INTO Difficulties (Description)
                VALUES (@Description)
            `);

        res.status(201).json({ message: "Thêm difficulty thành công" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi thêm difficulty", error: err.message });
    }
};

// ===== 3. GET: Lấy thông tin chi tiết 1 Difficulty theo ID =====
const getDifficultyById = async (req, res) => {
    try {
        const { DifficultyID } = req.params;
        const pool = await poolPromise;

        const result = await pool.request()
            .input("DifficultyID", DifficultyID)
            .query(`
                SELECT * FROM Difficulties 
                WHERE DifficultyID = @DifficultyID
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy difficulty" });
        }

        res.status(200).json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi lấy thông tin difficulty", error: err.message });
    }
};

// ===== 4. PUT: Sửa Difficulty =====
const editDifficulty = async (req, res) => {
    try {
        const { DifficultyID } = req.params;
        const { Description } = req.body;

        const pool = await poolPromise;
        const result = await pool.request()
            .input("DifficultyID", DifficultyID)
            .input("Description", Description)
            .query(`
                UPDATE Difficulties
                SET Description = @Description
                WHERE DifficultyID = @DifficultyID
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: "Không tìm thấy difficulty để cập nhật" });
        }

        res.status(200).json({ message: "Cập nhật thành công" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi khi sửa difficulty", error: err.message });
    }
};

// ===== 5. DELETE: Xóa Difficulty =====
const delDifficulty = async (req, res) => {
    try {
        const { DifficultyID } = req.params;
        const pool = await poolPromise;

        // Xử lý ràng buộc khóa ngoại trước khi xóa
        await pool.request()
            .input("DifficultyID", DifficultyID)
            .query(`UPDATE Courses SET DifficultyID = NULL WHERE DifficultyID = @DifficultyID`);

        await pool.request()
            .input("DifficultyID", DifficultyID)
            .query(`UPDATE Users SET CurrentDifficulty = NULL WHERE CurrentDifficulty = @DifficultyID`);

        const result = await pool.request()
            .input("DifficultyID", DifficultyID)
            .query(`DELETE FROM Difficulties WHERE DifficultyID = @DifficultyID`);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: "Không tìm thấy difficulty để xóa" });
        }

        res.status(200).json({ message: "Xóa thành công" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi xóa difficulty", error: err.message });
    }
};

module.exports = {
    getDifficulties,
    addDifficulty,
    getDifficultyById,
    editDifficulty,
    delDifficulty
};