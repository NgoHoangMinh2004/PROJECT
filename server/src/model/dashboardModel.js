const { poolPromise } = require('../config/database');

// Hàm lấy tất cả dữ liệu cho Dashboard
const getDashboardData = async () => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT * FROM Difficulties;
            SELECT * FROM Courses;
            SELECT * FROM Lessons;
            SELECT * FROM Exercises;
            SELECT * FROM LessonTests;
            SELECT * FROM Users;
            SELECT * FROM UserLessonProgress;
        `);
        return result.recordsets;
    } catch (error) {
        throw error;
    }
};
module.exports = { getDashboardData };