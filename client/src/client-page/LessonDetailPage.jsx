import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Radio, Typography, Space, message, Progress, Spin, Empty, FloatButton } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined, RobotOutlined } from '@ant-design/icons';
import axiosClient from '../services/axiosClient';
import AIChatDrawer from './AIChatDrawer'; // Đảm bảo bạn đã tạo file này

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
    const [currentLessonInfo, setCurrentLessonInfo] = useState(null);

    // --- State cho AI Chatbox ---
    const [aiVisible, setAiVisible] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiResponse, setAiResponse] = useState("");

    useEffect(() => {
        const fetchExercises = async () => {
            try {
                const res = await axiosClient.get(`/learning/exercises/${lessonId}`);
                const data = Array.isArray(res) ? res : [];
                setQuestions(data);
                if (data.length > 0) {
                    setLessonTitle(data[0].LessonTitle);
                    setCurrentLessonInfo({
                        lessonId: lessonId,
                        courseId: data[0].CourseID || 2,
                        orderIndex: data[0].OrderIndex
                    });
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

    // --- Hàm gọi AI giải thích lỗi sai ---
    const explainErrorWithAI = async (wrongQuestions) => {
        if (wrongQuestions.length === 0) return;

        setAiVisible(true);
        setAiLoading(true);

        // Lấy câu sai đầu tiên để AI phân tích
        const firstWrong = wrongQuestions[0];
        const context = {
            question: firstWrong.Question,
            userAnswer: answers[firstWrong.ExerciseID],
            correctAnswer: firstWrong.CorrectAnswer,
            optionA: firstWrong.OptionA,
            optionB: firstWrong.OptionB,
            optionC: firstWrong.OptionC,
            optionD: firstWrong.OptionD,
        };

        try {
            const res = await axiosClient.post('/ai/chat', {
                message: "Giải thích tại sao tôi làm sai câu này",
                context: context
            });
            setAiResponse(res.reply);
        } catch (error) {
            setAiResponse("HM AI Assistant hiện đang bận, vui lòng thử lại sau!");
        } finally {
            setAiLoading(false);
        }
    };

    const handleAnswer = (qId, val) => {
        if (submitted) return;
        setAnswers(prev => ({ ...prev, [qId]: val }));
    };

    const handleSubmit = async () => {
        if (Object.keys(answers).length < questions.length) {
            message.warning("Bạn hãy làm hết các câu hỏi trước khi nộp!");
            return;
        }

        let correctCount = 0;
        let wrongQuestions = [];

        questions.forEach(q => {
            if (answers[q.ExerciseID] === q.CorrectAnswer) {
                correctCount++;
            } else {
                wrongQuestions.push(q);
            }
        });

        const finalScore = correctCount;
        setScore(finalScore);
        setSubmitted(true);

        // Nếu có lỗi sai, tự động gọi AI
        if (wrongQuestions.length > 0) {
            explainErrorWithAI(wrongQuestions);
        }

        if (finalScore === questions.length) {
            try {
                await axiosClient.post('/learning/complete-lesson', {
                    lessonId: lessonId,
                    courseId: currentLessonInfo?.courseId,
                    orderIndex: currentLessonInfo?.orderIndex
                });
                message.success("Tuyệt vời! Bạn đã mở khóa bài mới!");
            } catch (error) {
                message.error("Lỗi cập nhật tiến độ");
            }
        }
    };

    if (loading) return (
        <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f5f5f5' }}>
            <Spin size="large" tip="Đang tải dữ liệu..." />
        </div>
    );

    return (
        <div style={{ height: '100vh', background: '#f5f5f5', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', overflow: 'hidden' }}>
            <Card
                style={{ width: '100%', maxWidth: 800, height: '90vh', borderRadius: 20, boxShadow: '0 10px 30px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}
                styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' } }}
            >
                {/* A. HEADER */}
                <div style={{ padding: '20px 30px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', zIndex: 10 }}>
                    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/learn')}>Thoát</Button>
                    <Title level={4} style={{ margin: 0, color: '#58cc02', textAlign: 'center', flex: 1 }}>
                        {lessonTitle || `Bài học số ${lessonId}`}
                    </Title>
                    <div style={{ width: 80 }}></div>
                </div>

                {/* B. DANH SÁCH CÂU HỎI */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px 30px', background: '#fafafa' }}>
                    {questions.length === 0 ? (
                        <Empty description="Chưa có bài tập">
                            <Button type="primary" onClick={() => navigate('/learn')}>Quay về</Button>
                        </Empty>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {questions.map((q, index) => {
                                let cardStyle = { borderRadius: 12, border: '1px solid #e0e0e0' };
                                let titleIcon = null;

                                if (submitted) {
                                    const isCorrect = answers[q.ExerciseID] === q.CorrectAnswer;
                                    cardStyle.background = isCorrect ? '#f6ffed' : '#fff2f0';
                                    cardStyle.borderColor = isCorrect ? '#b7eb8f' : '#ffccc7';
                                    titleIcon = isCorrect ? <CheckCircleOutlined style={{ color: '#52c41a', marginLeft: 10 }} /> : <CloseCircleOutlined style={{ color: '#ff4d4f', marginLeft: 10 }} />;
                                }

                                return (
                                    <Card key={q.ExerciseID} title={<span>Câu {index + 1} {titleIcon}</span>} style={cardStyle}>
                                        <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 15 }}>{q.Question}</div>
                                        <Radio.Group onChange={(e) => handleAnswer(q.ExerciseID, e.target.value)} value={answers[q.ExerciseID]} disabled={submitted} style={{ width: '100%' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {['A', 'B', 'C', 'D'].map(opt => (
                                                    <div key={opt} onClick={() => !submitted && handleAnswer(q.ExerciseID, opt)}
                                                        style={{ padding: '10px', borderRadius: '8px', border: submitted && q.CorrectAnswer === opt ? '2px solid #52c41a' : '1px solid #f0f0f0', background: '#fff' }}>
                                                        <Radio value={opt}><b>{opt}.</b> {q[`Option${opt}`]}</Radio>
                                                    </div>
                                                ))}
                                            </div>
                                        </Radio.Group>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* C. FOOTER */}
                <div style={{ padding: '20px 30px', borderTop: '1px solid #f0f0f0', background: '#fff', textAlign: 'center' }}>
                    {!submitted ? (
                        <Button type="primary" size="large" onClick={handleSubmit} style={{ background: '#58cc02', borderColor: '#58cc02', width: '100%', maxWidth: '300px', height: '50px', fontSize: '18px', fontWeight: 'bold' }}>
                            Nộp bài
                        </Button>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <Title level={4} style={{ margin: 0 }}>Kết quả: {score} / {questions.length}</Title>
                                <Progress percent={Math.round((score / questions.length) * 100)} strokeColor="#58cc02" style={{ width: 200 }} />
                            </div>
                            <Button type="primary" size="large" onClick={() => navigate('/learn')} style={{ background: '#58cc02', width: '100%', maxWidth: '300px' }}>Hoàn thành</Button>
                        </div>
                    )}
                </div>
            </Card>

            {/* AI Assistant Components */}
            <AIChatDrawer
                visible={aiVisible}
                onClose={() => setAiVisible(false)}
                loading={aiLoading}
                aiResponse={aiResponse}
            />

            {submitted && score < questions.length && (
                <FloatButton
                    icon={<RobotOutlined />}
                    type="primary"
                    style={{ right: 24, bottom: 80 }}
                    tooltip={<div>Xem giải thích AI</div>}
                    onClick={() => setAiVisible(true)}
                />
            )}
        </div>
    );
};

export default LessonDetailPage;