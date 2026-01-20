import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Popconfirm, Space, Card, Breadcrumb, Select, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import exerciseService from '../services/exerciseService';
import lessonService from '../services/lessonService';

const ExercisePage = () => {
    const [exercises, setExercises] = useState([]);
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExe, setEditingExe] = useState(null);
    const [form] = Form.useForm();

    const loadData = async () => {
        setLoading(true);
        try {
            const [exeData, lessonData] = await Promise.all([
                exerciseService.getAll(),
                lessonService.getAll()
            ]);
            setExercises(exeData);
            setLessons(lessonData);
        } catch (error) {
            message.error("Lỗi tải dữ liệu bài tập");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleSave = async (values) => {
        try {
            if (editingExe) {
                await exerciseService.update(editingExe.ExerciseID, values);
                message.success("Cập nhật bài tập thành công");
            } else {
                await exerciseService.create(values);
                message.success("Thêm bài tập thành công");
            }
            setIsModalOpen(false);
            form.resetFields();
            loadData();
        } catch (error) {
            message.error("Thao tác thất bại");
        }
    };

    const handleDelete = async (id) => {
        try {
            await exerciseService.delete(id);
            message.success("Đã xóa bài tập");
            loadData();
        } catch (error) {
            message.error("Lỗi khi xóa bài tập");
        }
    };

    const columns = [
        { title: 'ID', dataIndex: 'ExerciseID', key: 'ExerciseID', width: 60 },
        {
            title: 'Bài học',
            dataIndex: 'LessonTitle',
            key: 'LessonTitle',
            render: t => <Tag color="orange">{t}</Tag>
        },
        {
            title: 'Loại',
            dataIndex: 'ExerciseType',
            key: 'ExerciseType',
            render: type => <Tag color="blue">{type}</Tag>
        },
        { title: 'Câu hỏi', dataIndex: 'Question', key: 'Question', ellipsis: true },
        {
            title: 'Hành động',
            key: 'action',
            width: 120,
            render: (_, record) => (
                <Space>
                    <Button icon={<EditOutlined />} onClick={() => {
                        setEditingExe(record);
                        form.setFieldsValue(record);
                        setIsModalOpen(true);
                    }} />
                    <Popconfirm title="Xóa bài tập này?" onConfirm={() => handleDelete(record.ExerciseID)}>
                        <Button icon={<DeleteOutlined />} danger />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Breadcrumb style={{ marginBottom: 16 }} items={[{ title: 'Admin' }, { title: 'Quản lý Bài tập' }]} />

            <Card title="Danh sách Bài tập (Exercises)" extra={
                <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                    setEditingExe(null);
                    form.resetFields();
                    setIsModalOpen(true);
                }}> Thêm mới </Button>
            }>
                <Table dataSource={exercises} columns={columns} rowKey="ExerciseID" loading={loading} />
            </Card>

            <Modal
                title={editingExe ? "Sửa bài tập" : "Thêm bài tập mới"}
                open={isModalOpen}
                onOk={() => form.submit()}
                onCancel={() => setIsModalOpen(false)}
                width={600}
            >
                <Form form={form} layout="vertical" onFinish={handleSave}>
                    <Form.Item name="LessonID" label="Thuộc Bài học" rules={[{ required: true, message: 'Chọn bài học' }]}>
                        <Select placeholder="Chọn bài học">
                            {lessons.map(l => (
                                <Select.Option key={l.LessonID} value={l.LessonID}>{l.Title}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item name="ExerciseType" label="Loại bài tập" initialValue="Grammar">
                        <Select>
                            <Select.Option value="Grammar">Grammar (Ngữ pháp)</Select.Option>
                            <Select.Option value="Vocabulary">Vocabulary (Từ vựng)</Select.Option>
                            <Select.Option value="Listening">Listening (Nghe)</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item name="Question" label="Câu hỏi" rules={[{ required: true, message: 'Nhập nội dung câu hỏi' }]}>
                        <Input.TextArea rows={3} placeholder="Nhập nội dung câu hỏi bài tập..." />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default ExercisePage;