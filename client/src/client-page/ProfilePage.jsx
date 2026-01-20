import React from 'react';
import { Card, Avatar, Typography, Descriptions, Tag, Button, Row, Col } from 'antd';
import { UserOutlined, EditOutlined, SafetyCertificateOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const ProfilePage = () => {
    // Lấy thông tin user từ LocalStorage
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : {};

    // Màu sắc cho vai trò
    const roleColor = user.UserRole === 'Admin' ? 'red' : 'blue';

    return (
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <Card
                style={{ borderRadius: 15, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                cover={
                    <div style={{
                        height: 150,
                        background: 'linear-gradient(90deg, #58cc02 0%, #237804 100%)',
                        borderTopLeftRadius: 15,
                        borderTopRightRadius: 15
                    }} />
                }
            >
                <div style={{ marginTop: -75, textAlign: 'center', marginBottom: 25 }}>
                    <Avatar
                        size={120}
                        icon={<UserOutlined />}
                        style={{ backgroundColor: '#f56a00', border: '5px solid #fff' }}
                    />
                    <Title level={3} style={{ marginTop: 10, marginBottom: 5 }}>{user.FullName || 'Chưa cập nhật tên'}</Title>
                    <Tag color={roleColor} icon={<SafetyCertificateOutlined />}>
                        {user.UserRole || 'Student'}
                    </Tag>
                </div>

                <Descriptions title="Thông tin chi tiết" bordered column={{ xxl: 1, xl: 1, lg: 1, md: 1, sm: 1, xs: 1 }}>
                    <Descriptions.Item label="Email">{user.Email}</Descriptions.Item>
                    <Descriptions.Item label="Độ tuổi">{user.Age ? `${user.Age} tuổi` : 'Chưa cập nhật'}</Descriptions.Item>
                    <Descriptions.Item label="Trình độ hiện tại">
                        {user.DifficultyID === 1 ? 'Cơ bản' : user.DifficultyID === 2 ? 'Trung bình' : user.DifficultyID === 3 ? 'Nâng cao' : 'Chưa xếp lớp'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Mã người dùng (ID)">#{user.UserID}</Descriptions.Item>
                </Descriptions>

                <div style={{ textAlign: 'center', marginTop: 30 }}>
                    <Button type="primary" icon={<EditOutlined />} onClick={() => alert("Tính năng sửa hồ sơ đang phát triển")}>
                        Chỉnh sửa hồ sơ
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default ProfilePage;