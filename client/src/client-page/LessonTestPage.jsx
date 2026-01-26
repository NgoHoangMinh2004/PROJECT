import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Radio, Typography, message, Modal, Spin, Result, FloatButton } from 'antd';
import axiosClient from '../services/axiosClient';

const { Title, Text } = Typography;

const LessonTestPage = () => {
    const { testId } = useParams();
    const navigate = useNavigate();

    const [testInfo, setTestInfo] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitted, setSubmitted] = useState(false);
    const [scoreResult, setScoreResult] = useState(null);

    // --- 1. CHẶN PHÍM TẮT F5, CTRL+R ---
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (
                e.key === 'F5' ||
                (e.ctrlKey && e.key === 'r') ||
                (e.metaKey && e.key === 'r')
            ) {
                e.preventDefault();
                message.warning("Hành động tải lại trang bị vô hiệu hóa trong khi làm bài thi!");
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // --- 2. CẢNH BÁO F5/TẮT TAB VÀ PHẠT QUAY VỀ TRANG CHỦ ---
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (!submitted) {
                const msg = "Nếu bạn tải lại, bộ câu hỏi sẽ thay đổi và bạn phải làm lại từ đầu!";
                e.preventDefault();
                e.returnValue = msg;
                return msg;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [submitted]);

    // --- 3. CHẶN NÚT LÙI (BACK) VÀ XÁC NHẬN RỜI ĐI ---
    useEffect(() => {
        if (!submitted) {
            window.history.pushState(null, null, window.location.pathname);

            const handlePopState = () => {
                Modal.confirm({
                    title: 'Xác nhận hủy bài thi?',
                    content: 'Hành động này sẽ hủy bỏ các câu trả lời hiện tại và đưa bạn quay về trang Lộ trình học tập.',
                    okText: 'Đồng ý thoát',
                    cancelText: 'Tiếp tục làm bài',
                    onOk: () => {
                        navigate('/learn'); // Đưa về trang lộ trình (hoặc trang bài tập thường)
                    },
                    onCancel: () => {
                        window.history.pushState(null, null, window.location.pathname);
                    }
                });
            };

            window.addEventListener('popstate', handlePopState);
            return () => window.removeEventListener('popstate', handlePopState);
        }
    }, [submitted, navigate]);

    useEffect(() => {
        const fetchTest = async () => {
            try {
                const res = await axiosClient.get(`/learning/test-content/${testId}`);
                setTestInfo(res.testInfo);
                setQuestions(res.questions);
            } catch (error) {
                message.error("Lỗi tải bài kiểm tra.");
                navigate('/learn');
            } finally {
                setLoading(false);
            }
        };
        fetchTest();
    }, [testId, navigate]);

    const handleAnswer = (qId, val) => {
        if (submitted) return;
        setAnswers(prev => ({ ...prev, [qId]: val }));
    };

    const processSubmit = async () => {
        let correctCount = 0;
        let wrongQuestions = [];

        questions.forEach(q => {
            if (answers[q.ExerciseID] === q.CorrectAnswer) {
                correctCount++;
            } else {
                wrongQuestions.push(q);
            }
        });

        const finalScore = Math.round((correctCount / questions.length) * 100);

        try {
            await axiosClient.post('/learning/submit-test', {
                courseId: testInfo.CourseID,
                score: finalScore
            });

            setSubmitted(true);
            setScoreResult({ score: finalScore, isPassed: finalScore >= testInfo.PassScore });

            // --- TỰ ĐỘNG GỌI AI GIẢI THÍCH CÂU SAI ĐẦU TIÊN ---
            if (wrongQuestions.length > 0) {
                const firstWrong = wrongQuestions[0];
                const event = new CustomEvent('OPEN_AI_ASSISTANT', {
                    detail: {
                        message: "Mình làm sai câu này, hãy giải thích giúp mình nhé!",
                        context: {
                            question: firstWrong.Question,
                            userAnswer: answers[firstWrong.ExerciseID],
                            correctAnswer: firstWrong.CorrectAnswer,
                            OptionA: firstWrong.OptionA,
                            OptionB: firstWrong.OptionB,
                            OptionC: firstWrong.OptionC,
                            OptionD: firstWrong.OptionD,
                        }
                    }
                });
                window.dispatchEvent(event);
            }
        } catch (error) {
            message.error("Lỗi khi nộp bài");
        }
    };

    const handleSubmit = () => {
        if (Object.keys(answers).length < questions.length) {
            Modal.confirm({
                title: 'Nộp bài sớm?',
                content: 'Vẫn còn câu hỏi chưa chọn đáp án.',
                onOk: processSubmit
            });
        } else {
            processSubmit();
        }
    };

    if (loading) return (
        <div style={{ textAlign: 'center', marginTop: 100 }}>
            <Spin size="large">
                <div style={{ marginTop: 20 }}>Đang chuẩn bị đề thi ngẫu nhiên...</div>
            </Spin>
        </div>
    );

    if (submitted && scoreResult) {
        return (
            <div style={{ padding: 20, display: 'flex', justifyContent: 'center' }}>
                <Card style={{ width: 600, textAlign: 'center', borderRadius: 12 }}>
                    <Result
                        status={scoreResult.isPassed ? "success" : "error"}
                        title={scoreResult.isPassed ? "CHÚC MỪNG BẠN ĐÃ ĐẬU!" : "BẠN CẦN ÔN TẬP THÊM"}
                        subTitle={`Kết quả: ${scoreResult.score}/100. ${scoreResult.message}`}
                        extra={<Button type="primary" size="large" onClick={() => navigate('/learn')}>Về Lộ trình</Button>}
                    />
                </Card>
            </div>
        );
    }

    return (
        <div style={{ height: '100vh', overflowY: 'scroll', background: '#f5f5f5', padding: '20px 0' }}>
            <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 20px' }}>
                <Card style={{ marginBottom: 20, position: 'sticky', top: 0, zIndex: 100, borderTop: '5px solid #58cc02' }}>
                    <Title level={3} style={{ margin: 0 }}>{testInfo?.Title}</Title>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text>Vượt qua: <b style={{ color: '#58cc02' }}>{testInfo?.PassScore}</b> điểm</Text>
                        <Text type="secondary">Đã chọn: {Object.keys(answers).length}/{questions.length}</Text>
                    </div>
                </Card>

                {questions.map((q, index) => (
                    <Card key={q.ExerciseID} style={{ marginBottom: 15, borderRadius: 10 }} title={`Câu ${index + 1}`}>
                        <Title level={5}>{q.Question}</Title>
                        <Radio.Group onChange={(e) => handleAnswer(q.ExerciseID, e.target.value)} value={answers[q.ExerciseID]}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {['A', 'B', 'C', 'D'].map(opt => (
                                    <Radio key={opt} value={opt} style={{ padding: '8px', border: '1px solid #f0f0f0', borderRadius: 6 }}>
                                        <b>{opt}.</b> {q[`Option${opt}`]}
                                    </Radio>
                                ))}
                            </div>
                        </Radio.Group>
                    </Card>
                ))}

                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <Button type="primary" size="large" onClick={handleSubmit} style={{ width: 220, height: 50, fontSize: 18, fontWeight: 'bold', background: '#58cc02', borderColor: '#58cc02' }}>
                        HOÀN THÀNH BÀI THI
                    </Button>
                </div>
            </div>
            <FloatButton.BackTop />
        </div>
    );
};

export default LessonTestPage;