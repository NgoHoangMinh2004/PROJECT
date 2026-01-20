import axiosClient from './axiosClient';

const learningService = {
    // Lấy lộ trình học
    getLearningPath: () => {
        return axiosClient.get('/learning/path');
    }
};

export default learningService;