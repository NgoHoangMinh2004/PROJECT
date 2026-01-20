import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../services/axiosClient';

const { Title, Text } = Typography;

const RegisterPage = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const onFinish = async (values) => {
        setLoading(true);
        try {
            await axiosClient.post('/users/register', values);
            message.success('Đăng ký thành công! Hãy đăng nhập.');
            navigate('/login');
        } catch (error) {
            message.error(error.response?.data?.message || 'Đăng ký thất bại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
            <Card style={{ width: 400, borderRadius: 15, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <Title level={2} style={{ color: '#58cc02' }}>TẠO TÀI KHOẢN 🦉</Title>
                    <Text type="secondary">Bắt đầu hành trình học tiếng Anh ngay hôm nay</Text>
                </div>

                <Form layout="vertical" onFinish={onFinish}>
                    <Form.Item name="FullName" rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}>
                        <Input prefix={<UserOutlined />} placeholder="Họ và tên" size="large" />
                    </Form.Item>

                    <Form.Item name="Email" rules={[{ required: true, type: 'email', message: 'Email không hợp lệ!' }]}>
                        <Input prefix={<MailOutlined />} placeholder="Email" size="large" />
                    </Form.Item>

                    <Form.Item name="Password" rules={[{ required: true, min: 6, message: 'Mật khẩu ít nhất 6 ký tự!' }]}>
                        <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" size="large" />
                    </Form.Item>

                    <Button type="primary" htmlType="submit" block size="large" loading={loading} style={{ background: '#58cc02', borderColor: '#58cc02' }}>
                        ĐĂNG KÝ
                    </Button>

                    <div style={{ textAlign: 'center', marginTop: 15 }}>
                        Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
                    </div>
                </Form>
            </Card>
        </div>
    );
};

export default RegisterPage;