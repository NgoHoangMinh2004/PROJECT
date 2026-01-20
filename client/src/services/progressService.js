import axiosClient from './axiosClient';

const progressService = {
    getAll: () => {
        return axiosClient.get('/progress');
    },

    create: (data) => {
        return axiosClient.post('/progress/add', data);
    },

    update: (data) => {
        return axiosClient.post('/progress/update', data);
    },

    delete: (userId, lessonId) => {
        return axiosClient.delete(`/progress/delete/${userId}/${lessonId}`);
    }
};

export default progressService;