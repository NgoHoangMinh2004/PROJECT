import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Radio, Typography, message, Progress, FloatButton, Spin, Modal, Tag } from 'antd';
import { LeftOutlined, CheckCircleOutlined, CloseCircleOutlined, HomeOutlined, ReloadOutlined } from '@ant-design/icons';
import axiosClient from '../services/axiosClient';

const { Title, Text } = Typography;

const LessonDetailPage = () => {
    const { lessonId } = useParams();
    const navigate = useNavigate();

    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [lessonInfo, setLessonInfo] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(true);

    // --- THÊM STATE ĐỂ QUẢN LÝ KẾT QUẢ ---
    const [result, setResult] = useState({ score: 0, isPassed: false, correctCount: 0 });

    // CẤU HÌNH ĐIỂM ĐẬU (Ví dụ: phải đúng 80% mới qua)
    const PASS_PERCENT = 80;

    // 1. TẢI DỮ LIỆU
    useEffect(() => {
        fetchLessonData();
    }, [lessonId]);

    const fetchLessonData = async () => {
        try {
            setLoading(true);
            const res = await axiosClient.get(`/learning/lesson/${lessonId}/exercises`);

            if (Array.isArray(res) && res.length > 0) {
                setQuestions(res);
                setLessonInfo({
                    Title: res[0].LessonTitle,
                    CourseID: res[0].CourseID,
                    OrderIndex: res[0].OrderIndex
                });
            } else {
                message.warning("Bài học này chưa có câu hỏi.");
            }
        } catch (error) {
            console.error(error);
            message.error("Lỗi tải nội dung bài học.");
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = (qId, val) => {
        if (submitted) return;
        setAnswers(prev => ({ ...prev, [qId]: val }));
    };

    // 2. XỬ LÝ NỘP BÀI & CHẤM ĐIỂM
    const handleFinish = async () => {
        if (Object.keys(answers).length < questions.length) {
            return message.warning("Bạn hãy hoàn thành hết các câu hỏi trước khi nộp nhé!");
        }

        let correctCount = 0;
        let wrongQuestions = [];

        questions.forEach(q => {
            // eslint-disable-next-line eqeqeq
            if (answers[q.ExerciseID] == q.CorrectAnswer) {
                correctCount++;
            } else {
                wrongQuestions.push(q);
            }
        });

        // --- TÍNH ĐIỂM ---
        const score = Math.round((correctCount / questions.length) * 100);
        const isPassed = score >= PASS_PERCENT;

        setResult({ score, isPassed, correctCount });
        setSubmitted(true); // Hiển thị đáp án đúng sai ra màn hình

        // --- LOGIC PHÂN LUỒNG ---
        if (isPassed) {
            // A. NẾU ĐẬU: Gọi API lưu kết quả
            try {
                if (lessonInfo) {
                    await axiosClient.post('/learning/complete-lesson', {
                        lessonId: lessonId,
                        courseId: lessonInfo.CourseID,
                        orderIndex: lessonInfo.OrderIndex
                    });
                }
                message.success(`Tuyệt vời! Bạn đạt ${score}% và đã vượt qua bài học.`);

                // Khen ngợi
                triggerAI(`Hãy nói nguyên văn câu này:"Wao bạn được ${score}% Ngoài sức tưởng tượng luông" và thêm những đoạn nịnh như sau tuyệt đối không dùng lần 2 :"Nếu giữ phong độ này thì tiếng Anh của bạn sớm thôi sẽ bay rất cao" sau đó khuyến khích họ trở về lộ trình và tiếp tục học`, null);

                // Modal chúc mừng
                setTimeout(() => {
                    Modal.success({
                        title: 'Chúc mừng hoàn thành!',
                        content: `Bạn trả lời đúng ${correctCount}/${questions.length} câu. Bài tiếp theo đã mở.`,
                        okText: 'Về lộ trình',
                        onOk: () => navigate('/learn')
                    });
                }, 1500);

            } catch (error) {
                message.error("Lỗi lưu kết quả server.");
            }
        } else {
            // B. NẾU TRƯỢT: Không gọi API, bắt làm lại
            message.error(`Bạn chỉ đạt ${score}%. Cần tối thiểu ${PASS_PERCENT}% để qua bài.`);

            // Gọi AI giải thích lỗi sai
            if (wrongQuestions.length > 0) {
                const firstWrong = wrongQuestions[0];
                triggerAI(
                    "Mình làm sai câu này, hãy giải thích lỗi sai giúp mình nhé!",
                    {
                        question: firstWrong.Question,
                        userAnswer: answers[firstWrong.ExerciseID],
                        correctAnswer: firstWrong.CorrectAnswer,
                        OptionA: firstWrong.OptionA,
                        OptionB: firstWrong.OptionB,
                        OptionC: firstWrong.OptionC,
                        OptionD: firstWrong.OptionD,
                    }
                );
            }
        }
    };

    // 3. HÀM LÀM LẠI (Reset bài)
    const handleRetry = () => {
        setAnswers({});
        setSubmitted(false);
        setResult({ score: 0, isPassed: false, correctCount: 0 });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        message.info("Đã làm mới bài tập. Cố lên nhé!");
    };

    const triggerAI = (msg, ctx) => {
        setTimeout(() => {
            const event = new CustomEvent('OPEN_AI_ASSISTANT', {
                detail: { message: msg, context: ctx }
            });
            window.dispatchEvent(event);
        }, 800);
    };

    if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

    return (
        <div
            id="lesson-scroll-container"
            style={{
                height: '100vh',
                overflowY: 'auto',
                backgroundColor: '#f5f5f5',
                position: 'relative'
            }}
        >
            <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px', paddingBottom: 100 }}>

                {/* Header Bài học */}
                <Card style={{ marginBottom: 20, borderTop: '4px solid #58cc02', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Button icon={<LeftOutlined />} onClick={() => navigate('/learn')} type="text" />
                            <Title level={4} style={{ margin: 0, marginLeft: 10 }}>{lessonInfo?.Title || "Bài tập"}</Title>
                        </div>
                        {/* Hiển thị điểm số nếu đã nộp */}
                        {submitted && (
                            <Tag color={result.isPassed ? "success" : "error"} style={{ fontSize: 16, padding: '5px 10px' }}>
                                {result.score}/100 điểm
                            </Tag>
                        )}
                    </div>
                    <Progress
                        percent={Math.round((Object.keys(answers).length / questions.length) * 100)}
                        strokeColor={submitted && !result.isPassed ? "#ff4d4f" : "#58cc02"}
                        showInfo={false}
                    />
                </Card>

                {/* Danh sách câu hỏi */}
                {questions.map((q, index) => {
                    const isCorrect = submitted && answers[q.ExerciseID] == q.CorrectAnswer;
                    const isWrong = submitted && answers[q.ExerciseID] != q.CorrectAnswer;

                    return (
                        <Card
                            key={q.ExerciseID}
                            style={{
                                marginBottom: 15,
                                borderColor: isWrong ? '#ff4d4f' : (isCorrect ? '#58cc02' : '#f0f0f0'),
                                borderWidth: submitted ? 2 : 1
                            }}
                            title={
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Câu {index + 1}</span>
                                    {isCorrect && <CheckCircleOutlined style={{ color: '#58cc02', fontSize: 20 }} />}
                                    {isWrong && <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />}
                                </div>
                            }
                        >
                            <Title level={5}>{q.Question}</Title>
                            <Radio.Group
                                onChange={(e) => handleAnswer(q.ExerciseID, e.target.value)}
                                value={answers[q.ExerciseID]}
                                disabled={submitted}
                                style={{ width: '100%' }}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {['A', 'B', 'C', 'D'].map(opt => {
                                        let bg = 'transparent';
                                        if (submitted) {
                                            if (q.CorrectAnswer === opt) bg = '#d9f7be'; // Đáp án đúng luôn xanh
                                            else if (answers[q.ExerciseID] === opt) bg = '#ffccc7'; // Chọn sai thì đỏ
                                        }
                                        return (
                                            <Radio key={opt} value={opt} style={{ padding: '10px', border: '1px solid #f0f0f0', borderRadius: 8, background: bg }}>
                                                <b>{opt}.</b> {q[`Option${opt}`]}
                                            </Radio>
                                        );
                                    })}
                                </div>
                            </Radio.Group>
                        </Card>
                    );
                })}

                {/* KHU VỰC NÚT BẤM (Logic quan trọng) */}
                <div style={{ textAlign: 'center', marginTop: 30, marginBottom: 50 }}>

                    {/* 1. CHƯA NỘP -> Nút KIỂM TRA */}
                    {!submitted && questions.length > 0 && (
                        <Button
                            type="primary"
                            size="large"
                            onClick={handleFinish}
                            style={{ width: 220, height: 50, background: '#58cc02', fontSize: 18, fontWeight: 'bold' }}
                        >
                            NỘP BÀI
                        </Button>
                    )}

                    {/* 2. ĐÃ NỘP + TRƯỢT -> Nút LÀM LẠI */}
                    {submitted && !result.isPassed && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                            <Text type="danger" strong>Bạn chưa đạt điểm đậu ({PASS_PERCENT}%). Hãy thử lại!</Text>
                            <Button
                                type="primary"
                                danger
                                size="large"
                                icon={<ReloadOutlined />}
                                onClick={handleRetry}
                                style={{ width: 220, height: 50, fontSize: 18, fontWeight: 'bold' }}
                            >
                                LÀM LẠI
                            </Button>
                        </div>
                    )}

                    {/* 3. ĐÃ NỘP + ĐẬU -> Nút HOÀN THÀNH (Về trang chủ) */}
                    {submitted && result.isPassed && (
                        <Button
                            type="default"
                            size="large"
                            icon={<HomeOutlined />}
                            onClick={() => navigate('/learn')}
                            style={{
                                width: 220,
                                height: 50,
                                fontSize: 16,
                                fontWeight: 'bold',
                                border: '2px solid #58cc02',
                                color: '#58cc02'
                            }}
                        >
                            HOÀN THÀNH
                        </Button>
                    )}
                </div>

            </div>

            <FloatButton.BackTop target={() => document.getElementById('lesson-scroll-container')} style={{ right: 24, bottom: 100 }} />
        </div>
    );
};

export default LessonDetailPage;