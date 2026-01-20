const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // Lấy header Authorization
    const authHeader = req.headers['authorization'];

    // Header thường có dạng: "Bearer <token>"
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: "Bạn chưa đăng nhập (Thiếu Token)" });
    }

    try {
        // Giải mã token
        const decoded = jwt.verify(token, 'SECRET_KEY_CUA_BAN'); // Thay bằng key thật của bạn

        // Gán thông tin giải mã được vào req.user
        req.user = decoded;

        // Cho phép đi tiếp vào controller
        next();
    } catch (error) {
        return res.status(403).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }
};

module.exports = verifyToken;