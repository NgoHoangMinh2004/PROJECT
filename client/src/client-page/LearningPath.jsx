import React, { useState, useEffect } from 'react';
import { Timeline, Card, Button, Typography, Spin, message } from 'antd';
import { CheckCircleFilled, LockFilled, StarFilled, TrophyFilled } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import learningService from '../services/learningService';
import '../css/style.css';

const { Title, Text } = Typography;

const LearningPath = () => {
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate(); // Khởi tạo hook điều hướng

    useEffect(() => {
        fetchLearningPath();
    }, []);

    const fetchLearningPath = async () => {
        try {
            const data = await learningService.getLearningPath();
            setLessons(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            message.error("Không thể tải lộ trình học");
        } finally {
            setLoading(false);
        }
    };

    const handleStartLesson = (lesson) => {
        if (lesson.status === 'locked') {
            message.warning("Bạn cần hoàn thành bài trước đó!");
            return;
        }
        // Chuyển hướng sang trang làm bài tập (LessonDetailPage)
        navigate(`/lesson/${lesson.LessonID}`);
    };

    const renderDot = (status) => {
        if (status === 'completed') return <CheckCircleFilled style={{ fontSize: '24px', color: '#58cc02' }} />;
        if (status === 'active') return <StarFilled className="bouncing-star" style={{ fontSize: '32px', color: '#ffc107' }} />;
        return <LockFilled style={{ fontSize: '24px', color: '#e5e5e5' }} />;
    };

    const timelineItems = lessons.map((lesson) => ({
        color: lesson.status === 'active' ? '#58cc02' : '#d9d9d9',
        icon: renderDot(lesson.status), // Antd v5 dùng 'icon'
        label: ( // Antd v5 Timeline item nội dung để trong 'children' hoặc 'label'
            <Card
                className={`lesson-card ${lesson.status}`}
                onClick={() => handleStartLesson(lesson)}
                // Thay variant="none" bằng bordered={false} hoặc style tùy version, antd v5 mới nhất hỗ trợ variant
                bordered={false}
                style={{ boxShadow: 'none', background: 'transparent' }}
            >
                <div className="card-content" style={{ padding: '10px', border: '1px solid #f0f0f0', borderRadius: '10px', background: '#fff' }}>
                    <Title level={5} style={{ margin: 0, color: lesson.status === 'locked' ? '#bfbfbf' : '#4b4b4b' }}>
                        {lesson.Title}
                    </Title>
                    <div style={{ marginBottom: 8 }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            {lesson.Description}
                        </Text>
                    </div>

                    {lesson.status === 'active' && (
                        <Button type="primary" shape="round" className="start-button">
                            BẮT ĐẦU
                        </Button>
                    )}
                </div>
            </Card>
        )
    }));

    if (loading) return <div style={{ textAlign: 'center', marginTop: 50 }}><Spin size="large" /></div>;

    return (
        <div className="learning-container">
            <div className="learning-header" style={{ textAlign: 'center', marginBottom: 30 }}>
                <Title level={2} style={{ color: '#58cc02', marginBottom: 5 }}>Lộ trình học tập</Title>
                <div className="level-badge">
                    <TrophyFilled style={{ color: '#ffc107', marginRight: 8 }} />
                    <Text strong>Level 1</Text>
                </div>
            </div>

            <Timeline
                mode="alternate"
                className="custom-timeline"
                items={timelineItems}
            />
        </div>
    );
};

export default LearningPath;