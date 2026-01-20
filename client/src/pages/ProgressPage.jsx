import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, message, Popconfirm, Space, Card, Breadcrumb, Select, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, LineChartOutlined } from '@ant-design/icons';
import progressService from '../services/progressService';
import userService from '../services/userService';
import lessonService from '../services/lessonService';

const ProgressPage = () => {
    const [progressData, setProgressData] = useState([]);
    const [users, setUsers] = useState([]);
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [form] = Form.useForm();

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const [pRes, uRes, lRes] = await Promise.all([
                progressService.getAll(),
                userService.getAll(),
                lessonService.getAll()
            ]);
            setProgressData(pRes);
            setUsers(uRes);
            setLessons(lRes);
        } catch (error) {
            message.error("Không thể tải dữ liệu tiến trình");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadInitialData(); }, []);

    const handleSave = async (values) => {
        try {
            if (editingRecord) {
                await progressService.update(values);
                message.success("Cập nhật tiến trình thành công");
            } else {
                await progressService.create(values);
                message.success("Thêm tiến trình mới thành công");
            }
            setIsModalOpen(false);
            setEditingRecord(null);
            form.resetFields();
            loadInitialData();
        } catch (error) {
            message.error(error.response?.data?.message || "Thao tác thất bại");
        }
    };

    const handleDelete = async (userId, lessonId) => {
        try {
            await progressService.delete(userId, lessonId);
            message.success("Đã xóa bản ghi tiến trình");
            loadInitialData();
        } catch (error) {
            message.error("Lỗi khi xóa");
        }
    };

    const columns = [
        { title: 'Người dùng', dataIndex: 'FullName', key: 'FullName', render: t => <b>{t}</b> },
        { title: 'Bài học', dataIndex: 'LessonTitle', key: 'LessonTitle' },
        {
            title: 'Mức độ hiện tại',
            dataIndex: 'CurrentDifficulty',
            key: 'CurrentDifficulty',
            render: d => <Tag color="purple">Level {d}</Tag>
        },
        {
            title: 'Trạng thái',
            dataIndex: 'Unlocked',
            key: 'Unlocked',
            render: u => u ? <Tag color="green">Đã mở</Tag> : <Tag color="default">Khóa</Tag>
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <Button icon={<EditOutlined />} onClick={() => {
                        setEditingRecord(record);
                        form.setFieldsValue(record);
                        setIsModalOpen(true);
                    }} />
                    <Popconfirm
                        title="Xóa tiến trình này?"
                        onConfirm={() => handleDelete(record.UserID, record.LessonID)}
                    >
                        <Button icon={<DeleteOutlined />} danger />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Breadcrumb style={{ marginBottom: 16 }} items={[{ title: 'Admin' }, { title: 'Tiến trình học tập' }]} />

            <Card title={<span><LineChartOutlined /> Quản lý Tiến trình học viên</span>} extra={
                <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                    setEditingRecord(null);
                    form.resetFields();
                    setIsModalOpen(true);
                }}> Thiết lập mới </Button>
            }>
                <Table dataSource={progressData} columns={columns} rowKey={record => `${record.UserID}-${record.LessonID}`} loading={loading} />
            </Card>

            <Modal
                title={editingRecord ? "Cập nhật tiến trình" : "Thiết lập tiến trình học"}
                open={isModalOpen}
                onOk={() => form.submit()}
                onCancel={() => setIsModalOpen(false)}
            >
                <Form form={form} layout="vertical" onFinish={handleSave}>
                    <Form.Item name="UserID" label="Chọn học viên" rules={[{ required: true }]}>
                        <Select disabled={!!editingRecord}>
                            {users.map(u => <Select.Option key={u.UserID} value={u.UserID}>{u.FullName}</Select.Option>)}
                        </Select>
                    </Form.Item>

                    <Form.Item name="LessonID" label="Chọn bài học" rules={[{ required: true }]}>
                        <Select disabled={!!editingRecord}>
                            {lessons.map(l => <Select.Option key={l.LessonID} value={l.LessonID}>{l.Title}</Select.Option>)}
                        </Select>
                    </Form.Item>

                    <Form.Item name="CurrentDifficulty" label="Mức độ khó hiện tại" initialValue={1}>
                        <Select>
                            <Select.Option value={1}>Cơ bản (Level 1)</Select.Option>
                            <Select.Option value={2}>Trung bình (Level 2)</Select.Option>
                            <Select.Option value={3}>Nâng cao (Level 3)</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item name="Unlocked" label="Trạng thái mở khóa" initialValue={1}>
                        <Select>
                            <Select.Option value={1}>Đã mở khóa (Mặc định)</Select.Option>
                            <Select.Option value={0}>Đang khóa</Select.Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default ProgressPage;