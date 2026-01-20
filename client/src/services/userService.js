import axiosClient from './axiosClient';

const userService = {
    getAll: () => {
        return axiosClient.get('/users');
    },

    create: (data) => {
        return axiosClient.post('/users/add', data);
    },

    update: (id, data) => {
        return axiosClient.post(`/users/edit/${id}`, data);
    },

    delete: (id) => {
        return axiosClient.delete(`/users/delete/${id}`);
    }
};

export default userService;