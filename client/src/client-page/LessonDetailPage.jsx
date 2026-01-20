import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Radio, Typography, Space, message, Progress, Spin, Empty } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import axiosClient from '../services/axiosClient';

const { Title } = Typography;

const LessonDetailPage = () => {
    const { lessonId } = useParams();
    const navigate = useNavigate();

    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const [lessonTitle, setLessonTitle] = useState("");

    useEffect(() => {
        const fetchExercises = async () => {
            try {
                const res = await axiosClient.get(`/learning/exercises/${lessonId}`);
                const data = Array.isArray(res) ? res : [];
                setQuestions(data);
                if (data.length > 0) {
                    setLessonTitle(data[0].LessonTitle);
                }
            } catch (error) {
                console.error(error);
                message.error("Lỗi tải bài tập");
            } finally {
                setLoading(false);
            }
        };
        fetchExercises();
    }, [lessonId]);

    const handleAnswer = (qId, val) => {
        if (submitted) return;
        setAnswers(prev => ({ ...prev, [qId]: val }));
    };

    const handleSubmit = () => {
        if (Object.keys(answers).length < questions.length) {
            message.warning("Bạn hãy làm hết các câu hỏi trước khi nộp!");
            return;
        }

        let correctCount = 0;
        questions.forEach(q => {
            if (answers[q.ExerciseID] === q.CorrectAnswer) {
                correctCount++;
            }
        });
        setScore(correctCount);
        setSubmitted(true);
        message.success("Đã nộp bài thành công!");
    };

    if (loading) return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Spin size="large" tip="Đang tải..." /></div>;

    return (
        // 1. CONTAINER CHÍNH: Full màn hình, không cuộn body
        <div style={{
            height: '100vh',
            background: '#f5f5f5',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            overflow: 'hidden' // Ngăn cuộn trang ngoài
        }}>

            {/* 2. CARD CỐ ĐỊNH: Chiều cao 90vh */}
            <Card
                style={{
                    width: '100%',
                    maxWidth: 800,
                    height: '90vh', // Chiều cao cố định
                    borderRadius: 20,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    display: 'flex',
                    flexDirection: 'column'
                }}
                // Antd v5: Ghi đè style body để dùng flex column
                styles={{
                    body: {
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        padding: 0,
                        overflow: 'hidden'
                    }
                }}
            >

                {/* A. HEADER (CỐ ĐỊNH) */}
                <div style={{
                    padding: '20px 30px',
                    borderBottom: '1px solid #f0f0f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#fff',
                    zIndex: 10
                }}>
                    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/learn')}>Thoát</Button>
                    <Title level={4} style={{ margin: 0, color: '#58cc02', textAlign: 'center', flex: 1 }}>
                        {lessonTitle || `Bài học số ${lessonId}`}
                    </Title>
                    <div style={{ width: 80 }}></div>
                </div>

                {/* B. DANH SÁCH CÂU HỎI (CUỘN ĐƯỢC) */}
                <div style={{
                    flex: 1, // Chiếm hết khoảng trống còn lại
                    overflowY: 'auto', // CHỈ CUỘN VÙNG NÀY
                    padding: '20px 30px',
                    background: '#fafafa'
                }}>
                    {questions.length === 0 ? (
                        <Empty description="Chưa có bài tập cho bài học này">
                            <Button type="primary" onClick={() => navigate('/learn')}>Quay về</Button>
                        </Empty>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {questions.map((q, index) => {
                                let cardStyle = { borderRadius: 12, border: '1px solid #e0e0e0', boxShadow: 'none' };
                                let titleIcon = null;

                                if (submitted) {
                                    const isCorrect = answers[q.ExerciseID] === q.CorrectAnswer;
                                    if (isCorrect) {
                                        cardStyle = { ...cardStyle, background: '#f6ffed', borderColor: '#b7eb8f' };
                                        titleIcon = <CheckCircleOutlined style={{ color: '#52c41a', marginLeft: 10 }} />;
                                    } else {
                                        cardStyle = { ...cardStyle, background: '#fff2f0', borderColor: '#ffccc7' };
                                        titleIcon = <CloseCircleOutlined style={{ color: '#ff4d4f', marginLeft: 10 }} />;
                                    }
                                }

                                return (
                                    <Card key={q.ExerciseID} type="inner" title={<span>Câu {index + 1} {titleIcon}</span>} style={cardStyle}>
                                        <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 15 }}>{q.Question}</div>
                                        <Radio.Group
                                            onChange={(e) => handleAnswer(q.ExerciseID, e.target.value)}
                                            value={answers[q.ExerciseID]}
                                            disabled={submitted}
                                            style={{ width: '100%' }}
                                        >
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {['A', 'B', 'C', 'D'].map(opt => (
                                                    <div
                                                        key={opt}
                                                        style={{
                                                            padding: '10px 15px',
                                                            borderRadius: '8px',
                                                            border: submitted && q.CorrectAnswer === opt ? '2px solid #52c41a' : '1px solid #f0f0f0',
                                                            background: submitted && q.CorrectAnswer === opt ? '#fff' : '#fff',
                                                            cursor: submitted ? 'default' : 'pointer'
                                                        }}
                                                        onClick={() => !submitted && handleAnswer(q.ExerciseID, opt)}
                                                    >
                                                        <Radio value={opt} style={{ width: '100%' }}>
                                                            <span style={{ fontWeight: 'bold', marginRight: 5 }}>{opt}.</span>
                                                            {q[`Option${opt}`]}
                                                        </Radio>
                                                    </div>
                                                ))}
                                            </div>
                                        </Radio.Group>

                                        {submitted && answers[q.ExerciseID] !== q.CorrectAnswer && (
                                            <div style={{ marginTop: 15, color: '#ff4d4f', fontWeight: 'bold', padding: '10px', background: '#fff1f0', borderRadius: '5px' }}>
                                                Đáp án đúng: {q.CorrectAnswer}
                                            </div>
                                        )}
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* C. FOOTER (CỐ ĐỊNH) */}
                <div style={{
                    padding: '20px 30px',
                    borderTop: '1px solid #f0f0f0',
                    background: '#fff',
                    textAlign: 'center'
                }}>
                    {!submitted ? (
                        <Button
                            type="primary"
                            size="large"
                            onClick={handleSubmit}
                            style={{
                                background: '#58cc02',
                                borderColor: '#58cc02',
                                width: '100%',
                                maxWidth: '300px',
                                height: '50px',
                                fontSize: '18px',
                                fontWeight: 'bold'
                            }}
                        >
                            Nộp bài
                        </Button>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', width: '100%', justifyContent: 'center' }}>
                                <Title level={4} style={{ margin: 0 }}>Kết quả: {score} / {questions.length}</Title>
                                <Progress
                                    percent={Math.round((score / questions.length) * 100)}
                                    status={score === questions.length ? "success" : "normal"}
                                    strokeColor="#58cc02"
                                    style={{ width: 200 }}
                                />
                            </div>
                            <Button
                                type="primary"
                                size="large"
                                onClick={() => navigate('/learn')}
                                style={{ background: '#58cc02', width: '100%', maxWidth: '300px' }}
                            >
                                Hoàn thành & Quay lại
                            </Button>
                        </div>
                    )}
                </div>

            </Card>
        </div>
    );
};

export default LessonDetailPage;