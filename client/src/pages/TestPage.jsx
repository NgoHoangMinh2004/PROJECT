import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Popconfirm, Space, Card, Breadcrumb, Select, InputNumber, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckSquareOutlined } from '@ant-design/icons';
import testService from '../services/testService';
import lessonService from '../services/lessonService';

const TestPage = () => {
    const [tests, setTests] = useState([]);
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTest, setEditingTest] = useState(null);
    const [form] = Form.useForm();

    const loadData = async () => {
        setLoading(true);
        try {
            const [testData, lessonData] = await Promise.all([
                testService.getAll(),
                lessonService.getAll()
            ]);
            setTests(testData);
            setLessons(lessonData);
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
            title: 'Bài học',
            dataIndex: 'LessonTitle',
            key: 'LessonTitle',
            render: t => <Tag color="cyan">{t}</Tag>
        },
        { title: 'Tiêu đề bài test', dataIndex: 'Title', key: 'Title', render: t => <b>{t}</b> },
        {
            title: 'Điểm đạt',
            dataIndex: 'PassScore',
            key: 'PassScore',
            render: score => <Tag color={score >= 80 ? 'green' : 'orange'}>{score}/100</Tag>
        },
        {
            title: 'Độ khó',
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
                    <Popconfirm title="Xóa bài test này?" onConfirm={() => handleDelete(record.LessonTestID)}>
                        <Button icon={<DeleteOutlined />} danger />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Breadcrumb style={{ marginBottom: 16 }} items={[{ title: 'Admin' }, { title: 'Quản lý Bài kiểm tra' }]} />

            <Card title={<span><CheckSquareOutlined /> Danh sách Bài kiểm tra cuối bài</span>} extra={
                <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                    setEditingTest(null);
                    form.resetFields();
                    setIsModalOpen(true);
                }}> Thêm mới </Button>
            }>
                <Table dataSource={tests} columns={columns} rowKey="LessonTestID" loading={loading} />
            </Card>

            <Modal
                title={editingTest ? "Sửa bài kiểm tra" : "Thêm bài kiểm tra mới"}
                open={isModalOpen}
                onOk={() => form.submit()}
                onCancel={() => setIsModalOpen(false)}
                width={700}
            >
                <Form form={form} layout="vertical" onFinish={handleSave}>
                    <Form.Item name="LessonID" label="Thuộc Bài học" rules={[{ required: true, message: 'Vui lòng chọn bài học' }]}>
                        <Select placeholder="Chọn bài học">
                            {lessons.map(l => (
                                <Select.Option key={l.LessonID} value={l.LessonID}>{l.Title}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item name="Title" label="Tiêu đề bài test" rules={[{ required: true, message: 'Nhập tiêu đề' }]}>
                        <Input placeholder="Ví dụ: Final Test - Chào hỏi" />
                    </Form.Item>

                    <Form.Item name="Description" label="Mô tả nội dung">
                        <Input.TextArea rows={3} placeholder="Mô tả ngắn gọn về nội dung kiểm tra..." />
                    </Form.Item>

                    <div style={{ display: 'flex', gap: '20px' }}>
                        <Form.Item name="PassScore" label="Điểm đạt (0-100)" initialValue={70} style={{ flex: 1 }}>
                            <InputNumber min={0} max={100} style={{ width: '100%' }} />
                        </Form.Item>

                        <Form.Item name="DifficultyLevel" label="Độ khó (Level)" initialValue={1} style={{ flex: 1 }}>
                            <InputNumber min={1} max={5} style={{ width: '100%' }} />
                        </Form.Item>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default TestPage;