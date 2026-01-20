const { sql, poolPromise } = require("./config/database");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// ===== 1. Lấy danh sách Users (GET /users) =====
const getUsersPage = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query("SELECT * FROM Users");
        // SỬA: Trả về JSON để React hiển thị bảng
        res.json(result.recordset);
    } catch (err) {
        console.error("Lỗi lấy danh sách:", err.message);
        res.status(500).json({ message: 'Lỗi Server' });
    }
};

// ===== 2. Thêm User (POST /users/add) =====
const addUser = async (req, res) => {
    try {
        // Lấy dữ liệu từ React gửi lên
        const { FullName, Email, UserRole, Age, Level } = req.body;

        const pool = await poolPromise;
        await pool.request()
            .input('FullName', FullName)
            .input('Email', Email)
            // QUAN TRỌNG: Form React không có ô nhập Pass, nên phải set mặc định để SQL không lỗi
            .input('PasswordHash', '123456')
            .input('UserRole', UserRole || 'Student')
            .input('Age', Age || 0)
            .input('Level', Level || 1)
            .input('CurrentDifficulty', 1) // Mặc định
            .input('IsActive', 1)          // Mặc định
            .query(`INSERT INTO Users (FullName, Email, PasswordHash, UserRole, Age, Level, CurrentDifficulty, IsActive) 
                    VALUES (@FullName, @Email, @PasswordHash, @UserRole, @Age, @Level, @CurrentDifficulty, @IsActive)`);

        // SỬA: Trả về JSON báo thành công
        res.status(200).json({ message: "Thêm thành công" });
    } catch (err) {
        console.error("LỖI SQL (Add):", err.message); // Xem lỗi chi tiết ở Terminal đen
        res.status(500).json({ message: 'Lỗi thêm user', error: err.message });
    }
};

// ===== 3. Lấy 1 User để sửa (GET /users/edit/:UserID) =====
const getEditUserpage = async (req, res) => {
    try {
        const { UserID } = req.params;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('UserID', UserID)
            .query('SELECT * FROM Users WHERE UserID=@UserID');

        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi lấy user' });
    }
};

// ===== 4. Sửa User (POST /users/edit/:UserID) =====
const editUser = async (req, res) => {
    try {
        // QUAN TRỌNG: Lấy ID từ URL (params) chứ không phải body
        const { UserID } = req.params;
        const { FullName, Email, UserRole, Age, Level } = req.body;

        const pool = await poolPromise;
        await pool.request()
            .input('UserID', UserID)
            .input('FullName', FullName)
            .input('Email', Email)
            .input('UserRole', UserRole)
            .input('Age', Age)
            .input('Level', Level)
            .query(`UPDATE Users SET 
                    FullName=@FullName, Email=@Email, UserRole=@UserRole, Age=@Age, Level=@Level
                    WHERE UserID=@UserID`);

        res.json({ message: "Cập nhật thành công" });
    } catch (err) {
        console.error("LỖI SQL (Edit):", err.message);
        res.status(500).json({ message: 'Lỗi sửa user', error: err.message });
    }
};

// ===== 5. Xóa User (DELETE /users/delete/:UserID) =====
const delUser = async (req, res) => {
    try {
        const { UserID } = req.params;
        const pool = await poolPromise;

        // Xóa bảng phụ trước để tránh lỗi khóa ngoại (Foreign Key)
        await pool.request().input('UserID', UserID).query('DELETE FROM UserLessonProgress WHERE UserID = @UserID');

        // Xóa User
        await pool.request()
            .input('UserID', UserID)
            .query('DELETE FROM Users WHERE UserID = @UserID');

        res.json({ message: "Xóa thành công" });
    } catch (err) {
        console.error("LỖI SQL (Delete):", err.message);
        res.status(500).json({ message: 'Lỗi xóa user', error: err.message });
    }
};

const login = async (req, res) => {
    const { Email, Password } = req.body;

    try {
        const pool = await poolPromise;

        // 1. Tìm user theo Email
        const result = await pool.request()
            .input('Email', sql.VarChar, Email)
            .query('SELECT * FROM Users WHERE Email = @Email');

        const user = result.recordset[0];

        if (!user) {
            return res.status(401).json({ message: "Email không tồn tại trong hệ thống" });
        }

        // 2. So sánh mật khẩu người dùng nhập với PasswordHash trong DB
        const isMatch = await bcrypt.compare(Password, user.PasswordHash);

        if (isMatch) {
            // 3. Tạo JWT Token (Hết hạn sau 24h)
            const token = jwt.sign(
                { UserID: user.UserID, Role: user.UserRole },
                'SECRET_KEY_CUA_BAN', // Nên để trong file .env
                { expiresIn: '24h' }
            );

            // 4. Trả về thông tin (Không trả về PasswordHash)
            res.json({
                message: "Đăng nhập thành công",
                token: token,
                user: {
                    UserID: user.UserID,
                    FullName: user.FullName,
                    Email: user.Email,
                    Role: user.UserRole,
                    Age: user.Age
                }
            });
        } else {
            res.status(401).json({ message: "Mật khẩu không chính xác" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi hệ thống", error: err.message });
    }
};
const register = async (req, res) => {
    const { FullName, Email, Password } = req.body;

    try {
        const pool = await poolPromise;

        // 1. Kiểm tra Email đã tồn tại chưa
        const checkUser = await pool.request()
            .input('Email', sql.VarChar, Email)
            .query('SELECT Email FROM Users WHERE Email = @Email');

        if (checkUser.recordset.length > 0) {
            return res.status(400).json({ message: "Email này đã được đăng ký!" });
        }

        // 2. Mã hóa mật khẩu (Salt round = 10)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(Password, salt);

        // 3. Lưu vào Database
        await pool.request()
            .input('FullName', sql.NVarChar, FullName)
            .input('Email', sql.VarChar, Email)
            .input('PasswordHash', sql.VarChar, hashedPassword)
            .input('UserRole', sql.VarChar, 'Student') // Mặc định là học sinh
            .input('Age', sql.Int, 0)
            .input('Level', sql.Int, 1)
            .input('CurrentDifficulty', sql.Int, 1)
            .input('IsActive', sql.Bit, 1)
            .query(`
                INSERT INTO Users (FullName, Email, PasswordHash, UserRole, Age, Level, CurrentDifficulty, IsActive)
                VALUES (@FullName, @Email, @PasswordHash, @UserRole, @Age, @Level, @CurrentDifficulty, @IsActive)
            `);

        res.status(201).json({ message: "Đăng ký tài khoản thành công!" });
    } catch (err) {
        console.error("Lỗi đăng ký:", err.message);
        res.status(500).json({ message: "Lỗi hệ thống khi đăng ký", error: err.message });
    }
};

const updateProfileAfterTest = async (req, res) => {
    // UserID lấy từ Token (req.user do middleware auth giải mã)
    const userId = req.user.UserID;
    const { Age, DifficultyID } = req.body;

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('UserID', sql.Int, userId)
            .input('Age', sql.Int, Age)
            .input('CurrentDifficulty', sql.Int, DifficultyID)
            .query(`UPDATE Users SET Age = @Age, CurrentDifficulty = @CurrentDifficulty WHERE UserID = @UserID`);

        // Trả về thông tin User mới nhất
        const userResult = await pool.request()
            .input('UserID', sql.Int, userId)
            .query(`SELECT * FROM Users WHERE UserID = @UserID`);

        res.json({
            message: "Cập nhật thành công",
            user: userResult.recordset[0]
        });
    } catch (err) {
        res.status(500).json({ message: "Lỗi cập nhật", error: err.message });
    }
};

module.exports = { getUsersPage, addUser, getEditUserpage, editUser, delUser, login, register, updateProfileAfterTest };