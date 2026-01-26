import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Popconfirm, Space, Card, Breadcrumb, Select, InputNumber, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, TrophyOutlined } from '@ant-design/icons';
import testService from '../services/testService';
import courseService from '../services/courseService'; // SỬA: Dùng courseService thay vì lessonService

const TestPage = () => {
    const [tests, setTests] = useState([]);
    const [courses, setCourses] = useState([]); // SỬA: Lưu danh sách khóa học
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTest, setEditingTest] = useState(null);
    const [form] = Form.useForm();

    const loadData = async () => {
        setLoading(true);
        try {
            // SỬA: Gọi API lấy danh sách bài test và danh sách khóa học (Levels)
            const [testData, courseData] = await Promise.all([
                testService.getAll(),
                courseService.getAll()
            ]);
            setTests(testData);
            setCourses(courseData);
        } catch (error) {
            message.error("Lỗi tải dữ liệu bài kiểm tra");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleSave = async (values) => {
        try {
            if (editingTest) {
                await testService.update(editingTest.LessonTestID, values);
                message.success("Cập nhật bài kiểm tra thành công");
            } else {
                await testService.create(values);
                message.success("Thêm bài kiểm tra thành công");
            }
            setIsModalOpen(false);
            setEditingTest(null);
            form.resetFields();
            loadData();
        } catch (error) {
            message.error("Thao tác thất bại");
        }
    };

    const handleDelete = async (id) => {
        try {
            await testService.delete(id);
            message.success("Đã xóa bài kiểm tra");
            loadData();
        } catch (error) {
            message.error("Lỗi khi xóa bài kiểm tra");
        }
    };

    const columns = [
        { title: 'ID', dataIndex: 'LessonTestID', key: 'LessonTestID', width: 60 },
        {
            title: 'Thuộc Level (Course)', // SỬA: Đổi tiêu đề cột
            dataIndex: 'LevelTitle', // SỬA: Key này từ API JOIN Courses trả về
            key: 'LevelTitle',
            render: t => <Tag color="blue">{t}</Tag>
        },
        { title: 'Tiêu đề bài test', dataIndex: 'Title', key: 'Title', render: t => <b>{t}</b> },
        {
            title: 'Điểm qua bài',
            dataIndex: 'PassScore',
            key: 'PassScore',
            render: score => <Tag color={score >= 70 ? 'green' : 'orange'}>{score}/100</Tag>
        },
        {
            title: 'Độ khó bài test',
            dataIndex: 'DifficultyLevel',
            key: 'DifficultyLevel',
            render: level => `Cấp độ ${level}`
        },
        {
            title: 'Hành động',
            key: 'action',
            width: 120,
            render: (_, record) => (
                <Space>
                    <Button icon={<EditOutlined />} onClick={() => {
                        setEditingTest(record);
                        form.setFieldsValue(record);
                        setIsModalOpen(true);
                    }} />
                    <Popconfirm title="Xóa bài test cuối level này?" onConfirm={() => handleDelete(record.LessonTestID)}>
                        <Button icon={<DeleteOutlined />} danger />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Breadcrumb style={{ marginBottom: 16 }} items={[{ title: 'Admin' }, { title: 'Quản lý Bài kiểm tra Level' }]} />

            <Card title={<span><TrophyOutlined /> Danh sách Bài kiểm tra cuối Level</span>} extra={
                <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                    setEditingTest(null);
                    form.resetFields();
                    setIsModalOpen(true);
                }}> Thêm bài test mới </Button>
            }>
                <Table dataSource={tests} columns={columns} rowKey="LessonTestID" loading={loading} />
            </Card>

            <Modal
                title={editingTest ? "Sửa bài kiểm tra Level" : "Thêm bài kiểm tra Level mới"}
                open={isModalOpen}
                onOk={() => form.submit()}
                onCancel={() => setIsModalOpen(false)}
                width={700}
                okText="Lưu"
                cancelText="Hủy"
            >
                <Form form={form} layout="vertical" onFinish={handleSave}>
                    {/* SỬA: Thay đổi từ LessonID sang CourseID */}
                    <Form.Item name="CourseID" label="Áp dụng cho Level (Course)" rules={[{ required: true, message: 'Vui lòng chọn Level' }]}>
                        <Select placeholder="Chọn Level áp dụng bài test này">
                            {courses.map(c => (
                                <Select.Option key={c.CourseID} value={c.CourseID}>{c.CourseName}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item name="Title" label="Tiêu đề bài test" rules={[{ required: true, message: 'Nhập tiêu đề' }]}>
                        <Input placeholder="Ví dụ: Kiểm tra cuối khóa - Beginner" />
                    </Form.Item>

                    <Form.Item name="Description" label="Mô tả nội dung bài test">
                        <Input.TextArea rows={3} placeholder="Mô tả các kỹ năng sẽ kiểm tra (Nghe, Nói, Đọc, Viết...)" />
                    </Form.Item>

                    <div style={{ display: 'flex', gap: '20px' }}>
                        <Form.Item name="PassScore" label="Điểm đạt (0-100)" initialValue={70} style={{ flex: 1 }}>
                            <InputNumber min={0} max={100} style={{ width: '100%' }} />
                        </Form.Item>

                        <Form.Item name="DifficultyLevel" label="Độ khó đánh giá" initialValue={1} style={{ flex: 1 }}>
                            <InputNumber min={1} max={5} style={{ width: '100%' }} />
                        </Form.Item>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};
export default TestPage;