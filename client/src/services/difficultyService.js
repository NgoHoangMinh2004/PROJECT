import axiosClient from './axiosClient';

const difficultyService = {
    getAll: () => {
        return axiosClient.get('/dif');
    },

    create: (data) => {
        return axiosClient.post('/dif/add', data);
    },

    update: (id, data) => {
        return axiosClient.post(`/dif/edit/${id}`, data);
    },

    delete: (id) => {
        return axiosClient.delete(`/dif/delete/${id}`);
    }
};

export default difficultyService;