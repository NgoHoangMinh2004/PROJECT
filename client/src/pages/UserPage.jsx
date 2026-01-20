import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Popconfirm, Space, Card, Breadcrumb, Select, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import userService from '../services/userService'; // Import service

const UserPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const [form] = Form.useForm();

    // --- 1. HÀM LOAD DỮ LIỆU ---
    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await userService.getAll();
            // Backend trả về mảng recordset trực tiếp -> gán luôn
            setUsers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            message.error("Không thể lấy danh sách User");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    // --- 2. HÀM LƯU (THÊM / SỬA) ---
    const handleSave = async (values) => {
        try {
            if (editingUser) {
                // Gọi API Sửa: Cần truyền UserID vào
                await userService.update(editingUser.UserID, values);
                message.success("Cập nhật thành công");
            } else {
                // Gọi API Thêm
                await userService.create(values);
                message.success("Thêm mới thành công");
            }

            // Reset và tải lại bảng
            setIsModalOpen(false);
            setEditingUser(null);
            form.resetFields();
            loadUsers();
        } catch (error) {
            console.error(error);
            message.error("Thao tác thất bại (Kiểm tra lại Server)");
        }
    };

    // --- 3. HÀM XÓA ---
    const handleDelete = async (id) => {
        try {
            await userService.delete(id);
            message.success("Đã xóa User");
            loadUsers();
        } catch (error) {
            console.error(error);
            message.error("Lỗi khi xóa User");
        }
    };

    // --- CẤU HÌNH CỘT BẢNG (Khớp database) ---
    const columns = [
        { title: 'ID', dataIndex: 'UserID', key: 'UserID', width: 70 },
        { title: 'Họ tên', dataIndex: 'FullName', key: 'FullName', render: t => <b>{t}</b> },
        { title: 'Email', dataIndex: 'Email', key: 'Email' },
        {
            title: 'Vai trò',
            dataIndex: 'UserRole',
            key: 'UserRole',
            render: role => (
                <Tag color={role === 'Admin' ? 'red' : 'green'}>
                    {role ? role.toUpperCase() : 'STUDENT'}
                </Tag>
            )
        },
        { title: 'Tuổi', dataIndex: 'Age', key: 'Age' },
        { title: 'Level', dataIndex: 'Level', key: 'Level' },
        {
            title: 'Hành động',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <Button icon={<EditOutlined />} onClick={() => {
                        setEditingUser(record);
                        form.setFieldsValue(record); // Đổ dữ liệu cũ vào form
                        setIsModalOpen(true);
                    }} />
                    <Popconfirm title="Xóa User này?" onConfirm={() => handleDelete(record.UserID)}>
                        <Button icon={<DeleteOutlined />} danger />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Breadcrumb style={{ marginBottom: 16 }} items={[{ title: 'Admin' }, { title: 'Quản lý Người dùng' }]} />

            <Card
                title="Danh sách Người dùng"
                extra={
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                        setEditingUser(null); // Đặt chế độ thêm mới
                        form.resetFields();   // Xóa trắng form
                        setIsModalOpen(true); // Mở modal
                    }}>
                        Thêm mới
                    </Button>
                }
            >
                {/* rowKey rất quan trọng: phải là UserID */}
                <Table dataSource={users} columns={columns} rowKey="UserID" loading={loading} />
            </Card>

            <Modal
                title={editingUser ? "Sửa thông tin" : "Thêm người dùng mới"}
                open={isModalOpen}
                onOk={() => form.submit()}
                onCancel={() => setIsModalOpen(false)}
            >
                <Form form={form} layout="vertical" onFinish={handleSave}>
                    <Form.Item
                        name="FullName"
                        label="Họ tên"
                        rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                    >
                        <Input placeholder="Ví dụ: Nguyen Van A" />
                    </Form.Item>

                    <Form.Item
                        name="Email"
                        label="Email"
                        rules={[
                            { required: true, message: 'Vui lòng nhập email' },
                            { type: 'email', message: 'Email không hợp lệ' }
                        ]}
                    >
                        <Input placeholder="example@gmail.com" />
                    </Form.Item>

                    {/* Select chọn quyền Admin/Student */}
                    <Form.Item
                        name="UserRole"
                        label="Vai trò"
                        initialValue="Student"
                        rules={[{ required: true }]}
                    >
                        <Select>
                            <Select.Option value="Student">Student (Học viên)</Select.Option>
                            <Select.Option value="Admin">Admin (Quản trị)</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item name="Age" label="Tuổi">
                        <Input type="number" />
                    </Form.Item>

                    <Form.Item name="Level" label="Trình độ (Level)" initialValue={1}>
                        <Input type="number" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default UserPage;