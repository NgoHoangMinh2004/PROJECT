import React, { useState, useEffect } from 'react';
import { Timeline, Card, Button, Typography, Tag, Space } from 'antd';
import { CheckCircleFilled, LockFilled, PlayCircleFilled, StarFilled } from '@ant-design/icons';
import './LearningPath.css'; // File CSS tùy chỉnh thêm hiệu ứng

const { Title, Text } = Typography;

const LearningPath = () => {
    // Giả lập dữ liệu API trả về (kết hợp bảng Lessons và UserLessonProgress)
    // Trong thực tế, bạn sẽ gọi API ở đây
    const [lessons, setLessons] = useState([
        {
            LessonID: 1,
            Title: "Bài 1: Chào hỏi cơ bản",
            Description: "Cách chào hỏi và giới thiệu bản thân",
            Status: "completed", // Đã học xong
        },
        {
            LessonID: 2,
            Title: "Bài 2: Gia đình & Bạn bè",
            Description: "Từ vựng về các thành viên gia đình",
            Status: "active", // Đang học (Đây là bài hiện tại)
        },
        {
            LessonID: 3,
            Title: "Bài 3: Số đếm & Màu sắc",
            Description: "Học đếm từ 1-100 và các màu cơ bản",
            Status: "locked", // Chưa mở
        },
        {
            LessonID: 4,
            Title: "Bài 4: Đồ ăn & Thức uống",
            Description: "Gọi món tại nhà hàng",
            Status: "locked",
        }
    ]);

    // Hàm render icon dựa trên trạng thái
    const getDotIcon = (status) => {
        switch (status) {
            case 'completed':
                return <CheckCircleFilled style={{ fontSize: '24px', color: '#52c41a' }} />;
            case 'active':
                return <StarFilled style={{ fontSize: '32px', color: '#faad14' }} spin />; // Ngôi sao xoay xoay
            default:
                return <LockFilled style={{ fontSize: '24px', color: '#d9d9d9' }} />;
        }
    };

    // Hàm xử lý khi bấm vào bài học
    const handleStartLesson = (lesson) => {
        if (lesson.Status === 'locked') return;
        console.log(`Bắt đầu học bài: ${lesson.Title}`);
        // Điều hướng sang trang làm bài tập: navigate(/learn/${lesson.LessonID})
    };

    return (
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 20px' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <Title level={2} style={{ color: '#58cc02' }}>Lộ trình học tập</Title>
                <Text type="secondary">Hoàn thành các bài học để mở khóa cấp độ tiếp theo!</Text>
            </div>

            <Timeline mode="alternate">
                {lessons.map((lesson) => (
                    <Timeline.Item
                        key={lesson.LessonID}
                        dot={getDotIcon(lesson.Status)}
                        color={lesson.Status === 'active' ? 'blue' : (lesson.Status === 'completed' ? 'green' : 'gray')}
                    >
                        {/* Logic hiển thị Card */}
                        <Card
                            hoverable={lesson.Status !== 'locked'}
                            style={{
                                opacity: lesson.Status === 'locked' ? 0.6 : 1,
                                borderColor: lesson.Status === 'active' ? '#faad14' : '#f0f0f0',
                                borderWidth: lesson.Status === 'active' ? '2px' : '1px',
                                transform: lesson.Status === 'active' ? 'scale(1.05)' : 'scale(1)',
                                transition: 'all 0.3s'
                            }}
                            onClick={() => handleStartLesson(lesson)}
                        >
                            <Space direction="vertical" size={0}>
                                <Text strong style={{ fontSize: 16 }}>{lesson.Title}</Text>
                                <Text type="secondary" style={{ fontSize: 12 }}>{lesson.Description}</Text>

                                {lesson.Status === 'active' && (
                                    <Button
                                        type="primary"
                                        shape="round"
                                        icon={<PlayCircleFilled />}
                                        size="large"
                                        style={{ marginTop: 15, backgroundColor: '#58cc02', borderColor: '#58cc02', width: '100%' }}
                                    >
                                        BẮT ĐẦU NGAY
                                    </Button>
                                )}
                            </Space>
                        </Card>
                    </Timeline.Item>
                ))}
            </Timeline>
        </div>
    );
};

export default LearningPath;