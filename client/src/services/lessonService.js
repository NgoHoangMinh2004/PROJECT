import axiosClient from './axiosClient';

const lessonService = {
    // 1. Lấy danh sách (Khớp với router.get('/'))
    getAll: () => {
        return axiosClient.get('/lessons');
    },

    // 2. Thêm mới (Khớp với router.post('/add'))
    create: (data) => {
        return axiosClient.post('/lessons/add', data);
    },

    // 3. Cập nhật (Khớp với router.post('/edit/:LessonID'))
    update: (id, data) => {
        return axiosClient.post(`/lessons/edit/${id}`, data);
    },

    // 4. Xóa (Khớp với router.delete('/delete/:LessonID'))
    delete: (id) => {
        return axiosClient.delete(`/lessons/delete/${id}`);
    }
};

export default lessonService;