import axiosClient from './axiosClient';

const exerciseService = {
    getAll: () => {
        return axiosClient.get('/exe');
    },

    getById: (id) => {
        return axiosClient.get(`/exe/${id}`);
    },

    create: (data) => {
        return axiosClient.post('/exe/add', data);
    },

    update: (id, data) => {
        return axiosClient.post(`/exe/edit/${id}`, data);
    },

    delete: (id) => {
        return axiosClient.delete(`/exe/delete/${id}`);
    }
};

export default exerciseService;