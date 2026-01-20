import axiosClient from './axiosClient';

const courseService = {
    // Lấy tất cả khóa học
    getAll: () => {
        return axiosClient.get('/courses');
    },

    // Tạo mới
    create: (data) => {
        return axiosClient.post('/courses/add', data);
    },

    // Cập nhật
    update: (id, data) => {
        return axiosClient.post(`/courses/edit/${id}`, data);
    },

    // Xóa
    delete: (id) => {
        return axiosClient.delete(`/courses/delete/${id}`);
    }
};

export default courseService;