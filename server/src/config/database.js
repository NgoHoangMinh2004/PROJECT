const sql = require("mssql");

const config = {
    server: "localhost",
    database: "EnglishLearningDB",
    user: "minh",
    password: "123456",
    options: {
        encrypt: false,
        trustServerCertificate: true
    },
};

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log(" Kết nối LocalDB thành công");
        return pool;
    })
    .catch(err => {
        console.error(" DB lỗi:", err);
    });

module.exports = { sql, poolPromise };
