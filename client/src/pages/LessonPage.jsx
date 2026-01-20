import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Popconfirm, Space, Card, Breadcrumb, Select, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import lessonService from '../services/lessonService';
import courseService from '../services/courseService'; // Cần cái này để lấy danh sách khóa học

const LessonPage = () => {
    const [lessons, setLessons] = useState([]); // Dữ liệu bài học
    const [courses, setCourses] = useState([]); // Dữ liệu khóa học (để chọn trong Modal)
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLesson, setEditingLesson] = useState(null);

    const [form] = Form.useForm();

    // --- 1. HÀM LOAD DỮ LIỆU ---
    const loadData = async () => {
        setLoading(true);
        try {
            // Gọi song song cả Lesson và Course
            const [lessonList, courseList] = await Promise.all([
                lessonService.getAll(),
                courseService.getAll()
            ]);

            setLessons(Array.isArray(lessonList) ? lessonList : []);
            setCourses(Array.isArray(courseList) ? courseList : []);
        } catch (error) {
            console.error(error);
            message.error("Không thể tải dữ liệu");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // --- 2. HÀM LƯU (THÊM / SỬA) ---
    const handleSave = async (values) => {
        try {
            if (editingLesson) {
                // Backend yêu cầu params: LessonID
                await lessonService.update(editingLesson.LessonID, values);
                message.success("Cập nhật bài học thành công");
            } else {
                await lessonService.create(values);
                message.success("Thêm bài học thành công");
            }

            setIsModalOpen(false);
            setEditingLesson(null);
            form.resetFields();
            loadData(); // Tải lại bảng
        } catch (error) {
            console.error(error);
            message.error("Thao tác thất bại");
        }
    };

    // --- 3. HÀM XÓA ---
    const handleDelete = async (id) => {
        try {
            await lessonService.delete(id);
            message.success("Đã xóa bài học");
            loadData();
        } catch (error) {
            console.error(error);
            message.error("Lỗi khi xóa bài học (Có thể do ràng buộc dữ liệu)");
        }
    };

    // --- CẤU HÌNH CỘT BẢNG ---
    const columns = [
        { title: 'ID', dataIndex: 'LessonID', key: 'LessonID', width: 60 },
        {
            title: 'Khóa học',
            dataIndex: 'CourseName', // Backend bạn đã JOIN bảng Courses nên có trường này
            key: 'CourseName',
            render: t => <Tag color="blue">{t}</Tag>
        },
        { title: 'Tiêu đề', dataIndex: 'Title', key: 'Title', render: t => <b>{t}</b> },
        { title: 'Mục tiêu', dataIndex: 'LearningGoal', key: 'LearningGoal' },
        { title: 'Thứ tự', dataIndex: 'OrderIndex', key: 'OrderIndex', align: 'center' },
        {
            title: 'Hành động',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <Button icon={<EditOutlined />} onClick={() => {
                        setEditingLesson(record);
                        form.setFieldsValue(record); // Đổ dữ liệu cũ vào form
                        setIsModalOpen(true);
                    }} />
                    <Popconfirm title="Xóa bài học này?" onConfirm={() => handleDelete(record.LessonID)}>
                        <Button icon={<DeleteOutlined />} danger />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    // Helper tạo danh sách Select Option từ Courses
    const courseOptions = courses.map(c => ({
        label: c.CourseName,
        value: c.CourseID
    }));

    return (
        <div>
            <Breadcrumb style={{ marginBottom: 16 }} items={[{ title: 'Admin' }, { title: 'Quản lý Bài học' }]} />

            <Card
                title="Danh sách Bài học"
                extra={
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                        setEditingLesson(null);
                        form.resetFields();
                        setIsModalOpen(true);
                    }}>
                        Thêm mới
                    </Button>
                }
            >
                <Table dataSource={lessons} columns={columns} rowKey="LessonID" loading={loading} />
            </Card>

            <Modal
                title={editingLesson ? "Sửa bài học" : "Thêm bài học mới"}
                open={isModalOpen}
                onOk={() => form.submit()}
                onCancel={() => setIsModalOpen(false)}
                width={700}
            >
                <Form form={form} layout="vertical" onFinish={handleSave}>
                    <Form.Item
                        name="CourseID"
                        label="Thuộc Khóa học"
                        rules={[{ required: true, message: 'Vui lòng chọn khóa học!' }]}
                    >
                        <Select placeholder="Chọn khóa học" options={courseOptions} />
                    </Form.Item>

                    <Form.Item
                        name="Title"
                        label="Tiêu đề bài học"
                        rules={[{ required: true, message: 'Nhập tiêu đề!' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item name="TheoryContent" label="Nội dung lý thuyết">
                        <Input.TextArea rows={4} />
                    </Form.Item>

                    <Form.Item name="LearningGoal" label="Mục tiêu học tập">
                        <Input />
                    </Form.Item>

                    <Form.Item name="OrderIndex" label="Thứ tự hiển thị" initialValue={1}>
                        <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

// Component Tag nhỏ để hiển thị tên khóa học đẹp hơn
import { Tag } from 'antd';

export default LessonPage;