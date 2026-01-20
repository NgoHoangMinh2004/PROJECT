import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Divider } from 'antd'; // Thêm Divider để trang trí
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom'; // Import Link để chuyển trang
import axiosClient from '../services/axiosClient';

const { Title, Text } = Typography;

const LoginPage = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const res = await axiosClient.post('/users/login', {
                Email: values.Email,
                Password: values.Password
            });

            if (res && res.token) {
                localStorage.setItem('token', res.token);
                localStorage.setItem('user', JSON.stringify(res.user));

                message.success('Chào mừng ' + (res.user?.FullName || 'bạn'));
                const role = res.user.UserRole || res.user.Role;

                if (role === 'Admin') {
                    navigate('/admin');
                } else {
                    navigate('/learn');
                }
            } else {
                message.error("Đăng nhập thất bại: Server không trả về Token");
            }
        } catch (error) {
            console.error("Lỗi đăng nhập:", error);
            message.error(error.response?.data?.message || 'Email hoặc mật khẩu không đúng');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            minHeight: '100vh', background: '#f0f2f5'
        }}>
            <Card style={{ width: 400, borderRadius: 15, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <div style={{ textAlign: 'center', marginBottom: 30 }}>
                    <Title level={2} style={{ color: '#58cc02', margin: 0 }}>ENGLISH APP 🦉</Title>
                    <Text type="secondary">Chào mừng bạn quay trở lại!</Text>
                </div>

                <Form name="login_form" onFinish={onFinish} layout="vertical">
                    <Form.Item
                        name="Email"
                        rules={[{ required: true, type: 'email', message: 'Vui lòng nhập Email hợp lệ!' }]}
                    >
                        <Input prefix={<UserOutlined />} placeholder="Email" size="large" />
                    </Form.Item>

                    <Form.Item
                        name="Password"
                        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" size="large" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" size="large" block loading={loading}
                            style={{ background: '#58cc02', borderColor: '#58cc02' }}>
                            ĐĂNG NHẬP
                        </Button>
                    </Form.Item>

                    {/* --- PHẦN THÊM MỚI TẠI ĐÂY --- */}
                    <Divider plain style={{ color: '#888', fontSize: '12px' }}>Hoặc</Divider>

                    <div style={{ textAlign: 'center' }}>
                        <Text>Chưa có tài khoản? </Text>
                        <Link to="/register" style={{ color: '#58cc02', fontWeight: 'bold' }}>
                            Đăng ký ngay
                        </Link>
                    </div>
                    {/* ---------------------------- */}
                </Form>
            </Card>
        </div>
    );
};

export default LoginPage;