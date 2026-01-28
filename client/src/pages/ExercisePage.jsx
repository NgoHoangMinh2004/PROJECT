import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Popconfirm, Space, Card, Breadcrumb, Select, Tag, Row, Col, FloatButton } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, QuestionCircleOutlined, FilterOutlined } from '@ant-design/icons';
import exerciseService from '../services/exerciseService';
import lessonService from '../services/lessonService';

const { Option } = Select;
const { TextArea } = Input;

const ExercisePage = () => {
    const [exercises, setExercises] = useState([]); // Dữ liệu gốc (tất cả)
    const [filteredExercises, setFilteredExercises] = useState([]); // Dữ liệu đã lọc để hiển thị
    const [lessons, setLessons] = useState([]);

    // State cho bộ lọc
    const [selectedLessonFilter, setSelectedLessonFilter] = useState(null); // null = Hiện tất cả

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

    // 2. LOGIC LỌC DỮ LIỆU (Chạy mỗi khi exercises gốc hoặc filter thay đổi)
    useEffect(() => {
        if (!selectedLessonFilter) {
            setFilteredExercises(exercises); // Nếu không chọn gì -> Hiện hết
        } else {
            const filtered = exercises.filter(ex => ex.LessonID === selectedLessonFilter);
            setFilteredExercises(filtered);
        }
    }, [exercises, selectedLessonFilter]);

    // 3. XỬ LÝ LƯU
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
            loadData(); // Load lại để cập nhật list mới
        } catch (error) {
            message.error("Lỗi lưu bài tập");
        }
    };

    // 4. XỬ LÝ XÓA
    const handleDelete = async (id) => {
        try {
            await exerciseService.delete(id);
            message.success("Đã xóa bài tập");
            loadData();
        } catch (error) {
            message.error("Lỗi xóa bài tập");
        }
    };

    // 5. MỞ MODAL THÊM MỚI (Tự động điền bài học nếu đang lọc)
    const handleOpenAddModal = () => {
        setEditingExercise(null);
        form.resetFields();

        // Nếu đang lọc bài nào, thì set mặc định form là bài đó luôn cho tiện
        if (selectedLessonFilter) {
            form.setFieldValue('LessonID', selectedLessonFilter);
        }

        setIsModalOpen(true);
    };

    const columns = [
        { title: 'ID', dataIndex: 'ExerciseID', width: 60, align: 'center' },
        {
            title: 'Bài học',
            dataIndex: 'LessonTitle',
            render: t => <Tag color="blue">{t}</Tag>
        },
        {
            title: 'Câu hỏi',
            dataIndex: 'Question',
            ellipsis: true,
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

    const expandedRowRender = (record) => (
        <div style={{ paddingLeft: 50, background: '#f9f9f9', padding: 10 }}>
            <p><b>A:</b> {record.OptionA}</p>
            <p><b>B:</b> {record.OptionB}</p>
            <p><b>C:</b> {record.OptionC}</p>
            <p><b>D:</b> {record.OptionD}</p>
        </div>
    );

    return (
        <div
            id="exercise-scroll-container"
            style={{
                height: '100vh',
                overflowY: 'auto',
                padding: '20px',
                background: '#f0f2f5'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Breadcrumb items={[{ title: 'Admin' }, { title: 'Quản lý Bài tập' }]} />

                {/* --- BỘ LỌC BÀI HỌC --- */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontWeight: 500 }}><FilterOutlined /> Lọc theo bài:</span>
                    <Select
                        placeholder="Chọn bài học để lọc"
                        style={{ width: 250 }}
                        allowClear
                        value={selectedLessonFilter}
                        onChange={(val) => setSelectedLessonFilter(val)}
                    >
                        <Option value={null}>-- Tất cả bài học --</Option>
                        {lessons.map(l => (
                            <Option key={l.LessonID} value={l.LessonID}>{l.Title}</Option>
                        ))}
                    </Select>
                </div>
            </div>

            <Card
                title={<span><QuestionCircleOutlined /> Danh sách câu hỏi ({filteredExercises.length})</span>}
                extra={
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenAddModal}>
                        Thêm câu hỏi
                    </Button>
                }
            >
                <Table
                    // Dùng filteredExercises thay vì exercises
                    dataSource={filteredExercises}
                    columns={columns}
                    rowKey="ExerciseID"
                    loading={loading}
                    expandable={{ expandedRowRender }}
                    pagination={false} // Tắt phân trang để hiện hết
                    sticky={{ offsetHeader: 0 }}
                    scroll={{ x: 'max-content' }}
                />
            </Card>

            {/* --- MODAL FORM --- */}
            <Modal
                title={editingExercise ? "Sửa câu hỏi" : "Thêm câu hỏi mới"}
                open={isModalOpen}
                onOk={() => form.submit()}
                onCancel={() => setIsModalOpen(false)}
                width={800}
                style={{ top: 20 }}
            >
                <Form form={form} layout="vertical" onFinish={handleSave}>
                    <Form.Item name="LessonID" label="Thuộc Bài học" rules={[{ required: true }]}>
                        <Select placeholder="Chọn bài học..." showSearch optionFilterProp="children">
                            {lessons.map(l => (
                                <Option key={l.LessonID} value={l.LessonID}>
                                    {l.Title} (ID: {l.LessonID})
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item name="Question" label="Nội dung câu hỏi" rules={[{ required: true }]}>
                        <TextArea rows={2} placeholder="Nhập câu hỏi..." />
                    </Form.Item>

                    <Form.Item name="ExerciseType" label="Loại" initialValue="Quiz">
                        <Select>
                            <Option value="Quiz">Trắc nghiệm (Quiz)</Option>
                            <Option value="Listening">Nghe hiểu</Option>
                        </Select>
                    </Form.Item>

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

            <FloatButton.BackTop
                target={() => document.getElementById('exercise-scroll-container')}
                style={{ right: 24, bottom: 50 }}
            />
        </div>
    );
};

export default ExercisePage;