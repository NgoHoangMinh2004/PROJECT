import React, { useState, useEffect } from 'react';
import { Timeline, Typography, Spin, message, Button, Card, FloatButton, Select, Space } from 'antd';
import { CheckCircleFilled, LockFilled, StarFilled, TrophyFilled, RocketOutlined, SwapOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import learningService from '../services/learningService';
import axiosClient from '../services/axiosClient';
import '../css/style.css';

const { Title, Text } = Typography;
const { Option } = Select;

const LearningPath = () => {
    const [lessons, setLessons] = useState([]);
    const [unlockedCourses, setUnlockedCourses] = useState([]);
    const [testInfo, setTestInfo] = useState(null);
    const [canTakeTest, setCanTakeTest] = useState(false);
    const [courseId, setCourseId] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            // 1. Lấy danh sách Level đã mở khóa cho Menu
            // API này cần được định nghĩa ở backend để lấy các CourseID user đã có progress
            const coursesData = await axiosClient.get('/learning/unlocked-courses');
            setUnlockedCourses(Array.isArray(coursesData) ? coursesData : []);

            // 2. Lấy lộ trình học hiện tại (Backend tự xác định level mới nhất nếu ko truyền id)
            await fetchLearningPath();
        } catch (error) {
            console.error(error);
            message.error("Lỗi khởi tạo dữ liệu lộ trình");
        } finally {
            setLoading(false);
        }
    };

    const fetchLearningPath = async (selectedCourseId = null) => {
        try {
            const url = selectedCourseId ? `/learning/path?courseId=${selectedCourseId}` : `/learning/path`;
            const data = await learningService.getLearningPath(selectedCourseId);
            if (data.lessons) {
                setLessons(data.lessons);
                setTestInfo(data.test);
                setCanTakeTest(data.canTakeTest);
                setCourseId(data.currentCourseId);
            }
        } catch (error) {
            console.error(error);
            message.error("Không thể tải lộ trình học");
        }
    };

    const handleCourseChange = (value) => {
        setCourseId(value);
        fetchLearningPath(value); // Tải lại dữ liệu của Level được chọn
    };

    const handleStartLesson = (lesson) => {
        if (lesson.status === 'locked') {
            message.warning("Bạn cần hoàn thành bài trước đó!");
            return;
        }
        navigate(`/lesson/${lesson.LessonID}`);
    };

    const renderDot = (status) => {
        if (status === 'completed') return <CheckCircleFilled style={{ fontSize: '24px', color: '#58cc02' }} />;
        if (status === 'active') return <StarFilled className="bouncing-star" style={{ fontSize: '32px', color: '#ffc107' }} />;
        return <LockFilled style={{ fontSize: '24px', color: '#e5e5e5' }} />;
    };

    const timelineItems = lessons.map((lesson, index) => ({
        color: lesson.status === 'active' ? '#58cc02' : '#d9d9d9',
        dot: renderDot(lesson.status),
        children: (
            <div
                className={`lesson-circle-wrapper ${lesson.status}`}
                onClick={() => handleStartLesson(lesson)}
                style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    cursor: lesson.status === 'locked' ? 'not-allowed' : 'pointer',
                    width: '120px', margin: '0 auto'
                }}
            >
                <div style={{
                    width: 70, height: 70, borderRadius: '50%',
                    background: lesson.status === 'locked' ? '#e5e5e5' : '#58cc02',
                    borderBottom: lesson.status === 'locked' ? '5px solid #afafaf' : '5px solid #46a302',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    color: '#fff', fontSize: '20px', fontWeight: 'bold',
                    transition: 'all 0.2s', marginBottom: '8px', boxShadow: '0 4px 0 rgba(0,0,0,0.2)'
                }} className="lesson-node">
                    {index + 1}
                </div>
                <Text strong style={{ fontSize: '14px', color: lesson.status === 'locked' ? '#bfbfbf' : '#4b4b4b', textAlign: 'center', display: 'block' }}>
                    {lesson.Title}
                </Text>
            </div>
        )
    }));

    if (testInfo) {
        timelineItems.push({
            color: canTakeTest ? '#ff4d4f' : '#d9d9d9',
            dot: <TrophyFilled style={{ fontSize: '32px', color: canTakeTest ? '#ffc107' : '#d9d9d9' }} />,
            children: (
                <div style={{ textAlign: 'center', marginTop: 20 }}>
                    <Card style={{
                        width: 300, margin: '0 auto',
                        borderColor: canTakeTest ? '#ffc107' : '#f0f0f0',
                        background: canTakeTest ? '#fffbe6' : '#fafafa',
                        opacity: canTakeTest ? 1 : 0.7
                    }}>
                        <div style={{ marginBottom: 15 }}>
                            <RocketOutlined style={{ fontSize: 40, color: canTakeTest ? '#ff4d4f' : '#bfbfbf' }} />
                        </div>
                        <Title level={5} style={{ color: canTakeTest ? '#d48806' : '#bfbfbf' }}>{testInfo.Title}</Title>
                        <Button type="primary" size="large" danger disabled={!canTakeTest} onClick={() => navigate(`/test/${testInfo.LessonTestID}`)} style={{ width: '100%', fontWeight: 'bold', marginTop: 10, background: canTakeTest ? '#ff4d4f' : '#d9d9d9', borderColor: canTakeTest ? '#ff4d4f' : '#d9d9d9' }}>
                            {canTakeTest ? "LÀM BÀI NGAY" : "HÃY HOÀN THÀNH CÁC BÀI HỌC"}
                        </Button>
                    </Card>
                </div>
            )
        });
    }

    if (loading) return (
        <div style={{ textAlign: 'center', marginTop: 100 }}>
            <Spin size="large">
                <div style={{ marginTop: 50 }}>Đang tải lộ trình...</div>
            </Spin>
        </div>
    );
    return (
        <div id="scrollable-container" style={{ height: '100vh', overflowY: 'auto', backgroundColor: '#f5f5f5' }}>
            <div className="learning-container" style={{ paddingBottom: 60 }}>

                {/* MENU CHỌN LEVEL */}
                <div style={{ textAlign: 'center', paddingTop: 30, marginBottom: 20 }}>
                    <Space direction="vertical" size={2} style={{ display: 'flex' }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>CHƯƠNG TRÌNH ĐÃ MỞ KHÓA</Text>
                        <Select
                            value={courseId}
                            style={{ width: 280 }}
                            onChange={handleCourseChange}
                            suffixIcon={<SwapOutlined />}
                            size="large"
                        >
                            {unlockedCourses.map(course => (
                                <Option key={course.CourseID} value={course.CourseID}>
                                    {course.CourseName} (Level {course.CourseID - 1})
                                </Option>
                            ))}
                        </Select>
                    </Space>
                </div>

                <div className="learning-header" style={{ textAlign: 'center', marginBottom: 40 }}>
                    <Title level={2} style={{ color: '#58cc02', marginBottom: 5 }}>Lộ trình học tập</Title>
                    <div className="level-badge" style={{ display: 'inline-flex', alignItems: 'center', background: '#fff', padding: '5px 15px', borderRadius: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                        <TrophyFilled style={{ color: '#ffc107', marginRight: 8, fontSize: 18 }} />
                        <Text strong style={{ fontSize: 16 }}>Level {courseId ? courseId - 1 : 1}</Text>
                    </div>
                </div>

                <Timeline mode="alternate" className="custom-timeline" items={timelineItems} />
            </div>
            <FloatButton.BackTop target={() => document.getElementById('scrollable-container')} style={{ right: 24, bottom: 24 }} />
        </div>
    );
};

export default LearningPath;