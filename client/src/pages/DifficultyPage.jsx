import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Popconfirm, Space, Card, Breadcrumb } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import difficultyService from '../services/difficultyService';

const DifficultyPage = () => {
    const [difficulties, setDifficulties] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDif, setEditingDif] = useState(null);
    const [form] = Form.useForm();

    const loadDifficulties = async () => {
        setLoading(true);
        try {
            const data = await difficultyService.getAll();
            setDifficulties(data);
        } catch (error) {
            message.error("Không thể tải danh sách mức độ");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDifficulties();
    }, []);

    const handleSave = async (values) => {
        try {
            if (editingDif) {
                await difficultyService.update(editingDif.DifficultyID, values);
                message.success("Cập nhật thành công");
            } else {
                await difficultyService.create(values);
                message.success("Thêm mới thành công");
            }
            setIsModalOpen(false);
            setEditingDif(null);
            form.resetFields();
            loadDifficulties();
        } catch (error) {
            message.error("Thao tác thất bại");
        }
    };

    const handleDelete = async (id) => {
        try {
            await difficultyService.delete(id);
            message.success("Đã xóa mức độ");
            loadDifficulties();
        } catch (error) {
            message.error("Lỗi khi xóa (Có thể do ràng buộc dữ liệu)");
        }
    };

    const columns = [
        { title: 'ID', dataIndex: 'DifficultyID', key: 'DifficultyID', width: 100 },
        { title: 'Mô tả mức độ', dataIndex: 'Description', key: 'Description', render: t => <b>{t}</b> },
        {
            title: 'Hành động',
            key: 'action',
            width: 150,
            render: (_, record) => (
                <Space>
                    <Button icon={<EditOutlined />} onClick={() => {
                        setEditingDif(record);
                        form.setFieldsValue(record);
                        setIsModalOpen(true);
                    }} />
                    <Popconfirm title="Xóa mức độ này?" onConfirm={() => handleDelete(record.DifficultyID)}>
                        <Button icon={<DeleteOutlined />} danger />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Breadcrumb style={{ marginBottom: 16 }} items={[{ title: 'Admin' }, { title: 'Quản lý Mức độ' }]} />
            <Card title="Danh sách Mức độ (Difficulties)" extra={
                <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                    setEditingDif(null);
                    form.resetFields();
                    setIsModalOpen(true);
                }}> Thêm mới </Button>
            }>
                <Table dataSource={difficulties} columns={columns} rowKey="DifficultyID" loading={loading} />
            </Card>

            <Modal
                title={editingDif ? "Sửa mức độ" : "Thêm mức độ mới"}
                open={isModalOpen}
                onOk={() => form.submit()}
                onCancel={() => setIsModalOpen(false)}
            >
                <Form form={form} layout="vertical" onFinish={handleSave}>
                    <Form.Item name="Description" label="Tên/Mô tả mức độ" rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}>
                        <Input placeholder="Ví dụ: Nâng cao, Trung bình..." />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default DifficultyPage;