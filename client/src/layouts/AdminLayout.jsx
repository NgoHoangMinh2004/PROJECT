import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, theme } from 'antd';
import {
    UserOutlined,
    BookOutlined,
    DashboardOutlined,
    FileTextOutlined,
    ApartmentOutlined,
    QuestionCircleOutlined,
    LineChartOutlined,
    CheckSquareOutlined
} from '@ant-design/icons';

const { Header, Content, Footer, Sider } = Layout;

const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    // Định nghĩa menu
    const menuItems = [
        {
            key: '/admin',
            icon: <DashboardOutlined />,
            label: 'Tổng quan (Dashboard)',
        },
        {
            key: 'users',
            label: 'Quản lý Người dùng',
            type: 'group',
            children: [
                {
                    key: '/admin/users',
                    icon: <UserOutlined />,
                    label: 'Danh sách Users',
                },
            ]
        },
        {
            key: 'content',
            label: 'Nội dung học tập',
            type: 'group',
            children: [
                {
                    key: '/admin/courses',
                    icon: <BookOutlined />,
                    label: 'Quản lý Khóa học',
                },
                {
                    key: '/admin/lessons',
                    icon: <FileTextOutlined />,
                    label: 'Quản lý Bài học',
                },
                {
                    key: '/admin/exercises',
                    icon: <QuestionCircleOutlined />,
                    label: 'Quản lý Bài tập',
                },
                {
                    key: '/admin/progress',
                    icon: <LineChartOutlined />,
                    label: 'Tiến trình học tập',
                },
                {
                    key: '/admin/test',
                    icon: <CheckSquareOutlined />,
                    label: 'Quản lý Bài kiểm tra',
                },
            ]
        },
        {
            key: 'settings',
            label: 'Cấu hình hệ thống',
            type: 'group',
            children: [
                {
                    key: '/admin/difficulties',
                    icon: <ApartmentOutlined />,
                    label: 'Quản lý Mức độ',
                },
            ]
        },
    ];

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider
                breakpoint="lg"
                collapsedWidth="0"
                theme="light"
                style={{
                    boxShadow: '2px 0 8px 0 rgba(29,35,41,.05)'
                }}
            >
                <div style={{
                    height: 32,
                    margin: 16,
                    background: 'rgba(0, 0, 0, 0.05)',
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    color: '#1b5e20'
                }}>
                    ENGLISH ADMIN
                </div>

                <Menu
                    theme="light"
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    items={menuItems}
                    onClick={(e) => navigate(e.key)}
                />
            </Sider>

            <Layout>
                <Header style={{ padding: 0, background: colorBgContainer }} />
                <Content style={{ margin: '24px 16px 0' }}>
                    <div
                        style={{
                            padding: 24,
                            minHeight: 360,
                            background: colorBgContainer,
                            borderRadius: borderRadiusLG,
                        }}
                    >
                        <Outlet />
                    </div>
                </Content>
                <Footer style={{ textAlign: 'center' }}>
                    English Learning System ©{new Date().getFullYear()} Created by You
                </Footer>
            </Layout>
        </Layout>
    );
};

export default AdminLayout;