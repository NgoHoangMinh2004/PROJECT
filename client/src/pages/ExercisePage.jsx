import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Popconfirm, Space, Card, Breadcrumb, Select, Tag, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import exerciseService from '../services/exerciseService'; // File gọi API của bạn
import lessonService from '../services/lessonService';     // Để lấy danh sách bài học cho ô Select

const { Option } = Select;
const { TextArea } = Input;

const ExercisePage = () => {
    const [exercises, setExercises] = useState([]);
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExercise, setEditingExercise] = useState(null);
    const [form] = Form.useForm();

    // 1. LOAD DATA
    const loadData = async () => {
        setLoading(true);
        try {
            const [exList, lessonList] = await Promise.all([
                exerciseService.getAll(),
                lessonService.getAll()
            ]);
            setExercises(exList);
            setLessons(lessonList);
        } catch (error) {
            message.error("Lỗi tải dữ liệu");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    // 2. XỬ LÝ LƯU (THÊM / SỬA)
    const handleSave = async (values) => {
        try {
            if (editingExercise) {
                await exerciseService.update(editingExercise.ExerciseID, values);
                message.success("Cập nhật bài tập thành công");
            } else {
                await exerciseService.create(values);
                message.success("Thêm bài tập thành công");
            }
            setIsModalOpen(false);
            setEditingExercise(null);
            form.resetFields();
            loadData();
        } catch (error) {
            message.error("Lỗi lưu bài tập");
        }
    };

    // 3. XỬ LÝ XÓA
    const handleDelete = async (id) => {
        try {
            await exerciseService.delete(id);
            message.success("Đã xóa bài tập");
            loadData();
        } catch (error) {
            message.error("Lỗi xóa bài tập");
        }
    };

    // --- CẤU HÌNH CỘT BẢNG ---
    const columns = [
        { title: 'ID', dataIndex: 'ExerciseID', width: 60, align: 'center' },
        {
            title: 'Bài học',
            dataIndex: 'LessonTitle', // Backend cần JOIN để trả về cái này
            render: t => <Tag color="blue">{t}</Tag>
        },
        {
            title: 'Câu hỏi',
            dataIndex: 'Question',
            ellipsis: true, // Nếu dài quá thì cắt bớt
            width: 300
        },
        {
            title: 'Đáp án đúng',
            dataIndex: 'CorrectAnswer',
            align: 'center',
            render: t => <Tag color="green" style={{ fontWeight: 'bold' }}>{t}</Tag>
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <Button icon={<EditOutlined />} onClick={() => {
                        setEditingExercise(record);
                        form.setFieldsValue(record);
                        setIsModalOpen(true);
                    }} />
                    <Popconfirm title="Xóa câu hỏi này?" onConfirm={() => handleDelete(record.ExerciseID)}>
                        <Button icon={<DeleteOutlined />} danger />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    // --- HIỂN THỊ CHI TIẾT CÁC ĐÁP ÁN KHI BẤM DẤU CỘNG (+) ---
    const expandedRowRender = (record) => {
        return (
            <div style={{ paddingLeft: 50, background: '#f9f9f9', padding: 10 }}>
                <p><b>A:</b> {record.OptionA}</p>
                <p><b>B:</b> {record.OptionB}</p>
                <p><b>C:</b> {record.OptionC}</p>
                <p><b>D:</b> {record.OptionD}</p>
            </div>
        );
    };

    return (
        <div>
            <Breadcrumb style={{ marginBottom: 16 }} items={[{ title: 'Admin' }, { title: 'Quản lý Bài tập' }]} />

            <Card title={<span><QuestionCircleOutlined /> Ngân hàng câu hỏi</span>} extra={
                <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                    setEditingExercise(null);
                    form.resetFields();
                    setIsModalOpen(true);
                }}>Thêm câu hỏi</Button>
            }>
                <Table
                    dataSource={exercises}
                    columns={columns}
                    rowKey="ExerciseID"
                    loading={loading}
                    expandable={{ expandedRowRender }} // Thêm dòng này để hiện A, B, C, D
                />
            </Card>

            {/* --- MODAL FORM --- */}
            <Modal
                title={editingExercise ? "Sửa câu hỏi" : "Thêm câu hỏi mới"}
                open={isModalOpen}
                onOk={() => form.submit()}
                onCancel={() => setIsModalOpen(false)}
                width={800} // Form rộng hơn chút để chứa 4 đáp án
            >
                <Form form={form} layout="vertical" onFinish={handleSave}>

                    {/* Chọn bài học */}
                    <Form.Item name="LessonID" label="Thuộc Bài học" rules={[{ required: true }]}>
                        <Select placeholder="Chọn bài học..." showSearch optionFilterProp="children">
                            {lessons.map(l => (
                                <Option key={l.LessonID} value={l.LessonID}>
                                    {l.Title} (ID: {l.LessonID})
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    {/* Nhập câu hỏi */}
                    <Form.Item name="Question" label="Nội dung câu hỏi" rules={[{ required: true }]}>
                        <TextArea rows={2} placeholder="Nhập câu hỏi..." />
                    </Form.Item>

                    {/* Loại câu hỏi (nếu cần) */}
                    <Form.Item name="ExerciseType" label="Loại" initialValue="Quiz">
                        <Select>
                            <Option value="Quiz">Trắc nghiệm (Quiz)</Option>
                            <Option value="Listening">Nghe hiểu</Option>
                        </Select>
                    </Form.Item>

                    {/* --- KHU VỰC NHẬP 4 ĐÁP ÁN --- */}
                    <div style={{ background: '#f0f2f5', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                        <p style={{ fontWeight: 'bold', marginBottom: 10 }}>Các phương án trả lời:</p>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="OptionA" label="Đáp án A" rules={[{ required: true }]}>
                                    <Input prefix={<b>A.</b>} placeholder="Nhập đáp án A" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="OptionB" label="Đáp án B" rules={[{ required: true }]}>
                                    <Input prefix={<b>B.</b>} placeholder="Nhập đáp án B" />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="OptionC" label="Đáp án C" rules={[{ required: true }]}>
                                    <Input prefix={<b>C.</b>} placeholder="Nhập đáp án C" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="OptionD" label="Đáp án D" rules={[{ required: true }]}>
                                    <Input prefix={<b>D.</b>} placeholder="Nhập đáp án D" />
                                </Form.Item>
                            </Col>
                        </Row>
                    </div>

                    {/* Chọn đáp án đúng */}
                    <Form.Item
                        name="CorrectAnswer"
                        label="Đáp án đúng"
                        rules={[{ required: true, message: 'Vui lòng chọn đáp án đúng' }]}
                    >
                        <Select placeholder="Chọn đáp án đúng">
                            <Option value="A">A</Option>
                            <Option value="B">B</Option>
                            <Option value="C">C</Option>
                            <Option value="D">D</Option>
                        </Select>
                    </Form.Item>

                </Form>
            </Modal>
        </div>
    );
};

export default ExercisePage;