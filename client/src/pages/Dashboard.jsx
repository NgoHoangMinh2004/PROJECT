import React, { useState, useEffect } from 'react';
import { Tabs, Table, Tag, Card, Spin, message, Statistic, Row, Col } from 'antd';
import { UserOutlined, BookOutlined, FileTextOutlined } from '@ant-design/icons';

const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        users: [],
        courses: [],
        lessons: [],
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Gọi song song 3 API: users, courses và lessons
                const [usersRes, coursesRes, lessonsRes] = await Promise.all([
                    fetch('http://localhost:3000/users'),
                    fetch('http://localhost:3000/courses'),
                    fetch('http://localhost:3000/lessons')
                ]);

                if (!usersRes.ok || !coursesRes.ok || !lessonsRes.ok) {
                    throw new Error('Lỗi kết nối đến Server');
                }

                const usersData = await usersRes.json();
                const coursesData = await coursesRes.json();
                const lessonsData = await lessonsRes.json();

                setData({
                    users: Array.isArray(usersData) ? usersData : [],
                    courses: Array.isArray(coursesData) ? coursesData : [],
                    lessons: Array.isArray(lessonsData) ? lessonsData : [],
                });
            } catch (error) {
                console.error('Lỗi:', error);
                message.error('Không thể tải dữ liệu Dashboard');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Cấu hình cột cho bảng Users
    const userColumns = [
        { title: 'ID', dataIndex: 'UserID', key: 'UserID', width: 80 },
        { title: 'Họ tên', dataIndex: 'FullName', key: 'FullName', render: text => <b>{text}</b> },
        { title: 'Email', dataIndex: 'Email', key: 'Email' },
        {
            title: 'Vai trò',
            dataIndex: 'UserRole',
            key: 'UserRole',
            render: r => <Tag color={r === 'Admin' ? 'red' : 'blue'}>{r}</Tag>
        },
    ];

    // Cấu hình cột cho bảng Courses
    const courseColumns = [
        { title: 'ID', dataIndex: 'CourseID', key: 'CourseID', width: 80 },
        { title: 'Tên khóa', dataIndex: 'CourseName', key: 'CourseName', render: t => <b>{t}</b> },
        { title: 'Mô tả', dataIndex: 'Description', key: 'Description', ellipsis: true },
        { title: 'Độ khó', dataIndex: 'Difficulty', key: 'Difficulty' },
    ];

    // Cấu hình cột cho bảng Lessons
    const lessonColumns = [
        { title: 'ID', dataIndex: 'LessonID', key: 'LessonID', width: 80 },
        { title: 'Khóa học', dataIndex: 'CourseName', key: 'CourseName', render: t => <Tag color="green">{t}</Tag> },
        { title: 'Tên bài học', dataIndex: 'Title', key: 'Title', render: t => <b>{t}</b> },
        { title: 'Mục tiêu', dataIndex: 'LearningGoal', key: 'LearningGoal', ellipsis: true },
        { title: 'Thứ tự', dataIndex: 'OrderIndex', key: 'OrderIndex', align: 'center' },
    ];

    const items = [
        {
            key: '1',
            label: `Users (${data.users.length})`,
            children: <Table rowKey="UserID" columns={userColumns} dataSource={data.users} pagination={{ pageSize: 5 }} />
        },
        {
            key: '2',
            label: `Courses (${data.courses.length})`,
            children: <Table rowKey="CourseID" columns={courseColumns} dataSource={data.courses} pagination={{ pageSize: 5 }} />
        },
        {
            key: '3',
            label: `Lessons (${data.lessons.length})`,
            children: <Table rowKey="LessonID" columns={lessonColumns} dataSource={data.lessons} pagination={{ pageSize: 5 }} />
        },
    ];

    return (
        <div>
            <h2 style={{ marginBottom: '20px', color: '#1b5e20' }}>
                Tổng quan hệ thống
            </h2>

            {loading ? (
                <div style={{ textAlign: 'center', marginTop: 50 }}><Spin size="large" tip="Đang tải dữ liệu..." /></div>
            ) : (
                <>
                    {/* Thống kê nhanh */}
                    <Row gutter={16} style={{ marginBottom: 24 }}>
                        <Col span={8}>
                            <Card>
                                <Statistic
                                    title="Tổng Users"
                                    value={data.users.length}
                                    prefix={<UserOutlined />}
                                    valueStyle={{ color: '#3f8600' }}
                                />
                            </Card>
                        </Col>
                        <Col span={8}>
                            <Card>
                                <Statistic
                                    title="Tổng Khóa học"
                                    value={data.courses.length}
                                    prefix={<BookOutlined />}
                                    valueStyle={{ color: '#cf1322' }}
                                />
                            </Card>
                        </Col>
                        <Col span={8}>
                            <Card>
                                <Statistic
                                    title="Tổng Bài học"
                                    value={data.lessons.length}
                                    prefix={<FileTextOutlined />}
                                    valueStyle={{ color: '#1890ff' }}
                                />
                            </Card>
                        </Col>
                    </Row>

                    {/* Bảng chi tiết */}
                    <Card bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                        <Tabs defaultActiveKey="1" items={items} />
                    </Card>
                </>
            )}
        </div>
    );
};

export default Dashboard;