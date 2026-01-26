import axiosClient from './axiosClient';

const learningService = {
    // Lấy lộ trình học - Đã sửa để nhận courseId
    getLearningPath: (courseId) => {
        const url = courseId ? `/learning/path?courseId=${courseId}` : '/learning/path';
        return axiosClient.get(url);
    }
};

export default learningService;