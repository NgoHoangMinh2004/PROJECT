import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Popconfirm, Space, Card, Breadcrumb, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const CoursesPage = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);

    const [form] = Form.useForm();

    const API_URL = 'http://localhost:3000/courses';

    const loadCourses = async () => {
        setLoading(true);
        try {
            const response = await fetch(API_URL);
            const data = await response.json();
            setCourses(data);
        } catch (error) {
            message.error("Không thể kết nối đến Server");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCourses();
    }, []);

    const handleSave = async (values) => {
        try {
            const url = editingCourse
                ? `${API_URL}/edit/${editingCourse.CourseID}`
                : `${API_URL}/add`;
            const method = 'POST'; const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });

            if (response.ok) {
                message.success("Thao tác thành công");
                setIsModalOpen(false);
                setEditingCourse(null);
                form.resetFields();
                loadCourses();
            }
        } catch (error) {
            message.error("Lỗi kết nối");
        }
    };

    const handleDelete = async (id) => {
        try {
            const response = await fetch(`${API_URL}/delete/${id}`, { method: 'DELETE' });
            if (response.ok) {
                message.success("Đã xóa khóa học");
                loadCourses();
            }
        } catch (error) {
            message.error("Lỗi kết nối");
        }
    };

    const columns = [
        { title: 'ID', dataIndex: 'CourseID', key: 'CourseID' },
        { title: 'Tên khóa học', dataIndex: 'CourseName', key: 'CourseName', render: t => <b>{t}</b> },
        { title: 'Mô tả', dataIndex: 'Description', key: 'Description' },
        { title: 'Độ khó', dataIndex: 'Difficulty', key: 'Difficulty' },
        {
            title: 'Hành động',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <Button icon={<EditOutlined />} onClick={() => {
                        setEditingCourse(record);
                        form.setFieldsValue(record);
                        setIsModalOpen(true);
                    }} />
                    <Popconfirm title="Xóa khóa học này?" onConfirm={() => handleDelete(record.CourseID)}>
                        <Button icon={<DeleteOutlined />} danger />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            {/* 3. Cách viết Breadcrumb mới để hết cảnh báo Deprecated */}
            <Breadcrumb
                style={{ marginBottom: 16 }}
                items={[
                    { title: 'Admin' },
                    { title: 'Quản lý khóa học' },
                ]}
            />

            <Card
                title="Danh sách Khóa học"
                extra={
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                        setEditingCourse(null);
                        form.resetFields();
                        setIsModalOpen(true);
                    }}>
                        Thêm mới
                    </Button>
                }
            >
                <Table dataSource={courses} columns={columns} rowKey="CourseID" loading={loading} />
            </Card>

            <Modal
                title={editingCourse ? "Sửa khóa học" : "Thêm khóa học"}
                open={isModalOpen}
                onOk={() => form.submit()}
                onCancel={() => setIsModalOpen(false)}
            >
                <Form form={form} layout="vertical" onFinish={handleSave}>
                    <Form.Item name="CourseName" label="Tên khóa học" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="Description" label="Mô tả">
                        <Input.TextArea />
                    </Form.Item>
                    {!editingCourse && (
                        <Form.Item
                            name="DifficultyID"
                            label="Mức độ (Difficulty)"
                            initialValue={1} // Mặc định là 'Cơ bản' tương ứng với ID 1 trong DB
                        >
                            <Select placeholder="Chọn mức độ">
                                <Select.Option value={1}>🌱 1. Cơ bản</Select.Option>
                                <Select.Option value={3}>🌿 2. Trung cấp</Select.Option>
                                <Select.Option value={6}>🌳 3. Nâng cao</Select.Option>
                            </Select>
                        </Form.Item>
                    )}
                </Form>
            </Modal>
        </div>
    );
};

export default CoursesPage;