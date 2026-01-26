import React, { useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Space, message } from 'antd';
import { UserOutlined, LogoutOutlined, FormOutlined, ReadOutlined } from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import AIChatWidget from '../components/AIChatWidget';

const { Header, Content, Footer } = Layout;

const ClientLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // LẤY THÔNG TIN USER
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const fullName = user?.FullName || 'Người dùng';

    useEffect(() => {
        if (user) {
            // Check nếu là tài khoản mới
            if (Number(user.Age) === 0 || user.Age === undefined) {
                navigate('/onboarding', { replace: true });
            }
        } else {
            navigate('/login');
        }
    }, [user, navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        message.success('Đã đăng xuất');
        navigate('/login');
    };

    const userMenuItems = {
        items: [
            {
                key: '1',
                label: 'Hồ sơ cá nhân',
                icon: <UserOutlined />,
                onClick: () => navigate('/profile')
            },
            { key: '2', label: 'Đăng xuất', icon: <LogoutOutlined />, danger: true, onClick: handleLogout },
        ]
    };

    // Xác định menu đang chọn dựa trên URL
    const selectedKey = location.pathname.includes('curriculum') ? 'curriculum' : 'learn';

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Header style={{
                position: 'sticky', top: 0, zIndex: 1, width: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: '#fff', boxShadow: '0 2px 8px #f0f1f2'
            }}>
                <div className="logo" style={{ fontSize: '20px', fontWeight: 'bold', color: '#58cc02', cursor: 'pointer' }} onClick={() => navigate('/')}>
                    ENGLISH Website 🦉
                </div>

                <Menu
                    theme="light"
                    mode="horizontal"
                    selectedKeys={[selectedKey]}
                    style={{ borderBottom: 'none', minWidth: '300px' }}
                    items={[
                        { key: 'learn', icon: <FormOutlined />, label: 'Bài tập', onClick: () => navigate('/learn') },
                        { key: 'curriculum', icon: <ReadOutlined />, label: 'Giáo trình', onClick: () => navigate('/curriculum') },
                    ]}
                />

                <Space>
                    <Dropdown menu={userMenuItems} placement="bottomRight">
                        <Space style={{ cursor: 'pointer' }}>
                            <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#87d068' }} />
                            <span style={{ color: '#000' }}>{fullName}</span>
                        </Space>
                    </Dropdown>
                </Space>
            </Header>

            <Content style={{ padding: '0 50px', marginTop: 20, background: '#f0f2f5' }}>
                <div style={{ background: '#fff', padding: 24, minHeight: 380, borderRadius: '10px' }}>
                    <Outlet />
                </div>
            </Content>
            <Footer style={{ textAlign: 'center' }}>English App ©2026</Footer>
            <AIChatWidget />
        </Layout>
    );
};

export default ClientLayout;