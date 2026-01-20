import axios from 'axios';

const axiosClient = axios.create({
    baseURL: 'http://localhost:3000',
    headers: {
        'Content-Type': 'application/json',
    },
});

// INTERCEPTOR CHO YÊU CẦU (REQUEST)
axiosClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            // Gửi Token theo chuẩn Bearer
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// INTERCEPTOR CHO PHẢN HỒI (RESPONSE) - Giữ nguyên logic cũ của bạn
axiosClient.interceptors.response.use(
    (response) => {
        if (response && response.data) {
            return response.data;
        }
        return response;
    },
    (error) => {
        // Nếu Server trả về 401 (Hết hạn token hoặc không hợp lệ)
        if (error.response && error.response.status === 401) {
            localStorage.clear();
            window.location.href = '/login';
        }
        throw error;
    }
);

export default axiosClient;