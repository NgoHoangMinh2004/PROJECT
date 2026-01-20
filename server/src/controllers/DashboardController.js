const DashboardModel = require('../model/dashboardModel');

const getData = async (req, res) => {
    try {
        const recordsets = await DashboardModel.getDashboardData();
        const responseData = {
            difficulties: recordsets[0],
            courses: recordsets[1],
            lessons: recordsets[2],
            exercises: recordsets[3],
            tests: recordsets[4],
            users: recordsets[5],
            progress: recordsets[6]
        };
        res.status(200).json(responseData);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

module.exports = { getData };