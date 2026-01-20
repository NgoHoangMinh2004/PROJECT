import axiosClient from './axiosClient';

const testService = {
    // 1. Lấy danh sách (GET /test)
    getAll: () => {
        return axiosClient.get('/test');
    },

    // 2. Thêm mới (POST /test/add)
    create: (data) => {
        return axiosClient.post('/test/add', data);
    },

    // 3. Lấy chi tiết (GET /test/edit/:id)
    getById: (id) => {
        return axiosClient.get(`/test/edit/${id}`);
    },

    // 4. Cập nhật (POST /test/edit/:id)
    update: (id, data) => {
        return axiosClient.post(`/test/edit/${id}`, data);
    },

    // 5. Xóa (DELETE /test/delete/:id)
    delete: (id) => {
        return axiosClient.delete(`/test/delete/${id}`);
    }
};

export default testService;