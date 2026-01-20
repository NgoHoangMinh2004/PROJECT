import React, { useState, useEffect } from 'react';
import { Steps, Button, Card, Radio, InputNumber, message, Typography, Space, Spin, Empty } from 'antd';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../services/axiosClient';

const { Title, Text } = Typography;

const OnboardingPage = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [difficulty, setDifficulty] = useState(1);
    const [age, setAge] = useState(18);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // --- BƯỚC 1: CHỌN ĐỘ KHÓ ---
    const StepDifficulty = () => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Title level={3} style={{ color: '#58cc02' }}>Mục tiêu của bạn là gì?</Title>
            <Text type="secondary" style={{ marginBottom: 30 }}>Hãy chọn mức độ phù hợp để chúng tôi sắp xếp lộ trình.</Text>

            <Radio.Group onChange={(e) => setDifficulty(e.target.value)} value={difficulty} style={{ width: '100%', maxWidth: 500 }}>
                {/* Thay Space bằng div flex để tránh lỗi warning direction */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%' }}>
                    {[
                        { val: 1, label: '🌱 Cơ bản', desc: 'Tôi mất gốc hoặc mới bắt đầu học' },
                        { val: 2, label: '🌿 Trung bình', desc: 'Tôi đã có nền tảng ngữ pháp cơ bản' },
                        { val: 3, label: '🌳 Nâng cao', desc: 'Tôi muốn luyện tập chuyên sâu' }
                    ].map(opt => (
                        <div
                            key={opt.val}
                            onClick={() => setDifficulty(opt.val)}
                            style={{
                                padding: '20px',
                                border: difficulty === opt.val ? '2px solid #58cc02' : '1px solid #e5e5e5',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                background: difficulty === opt.val ? '#f0f9eb' : '#fff',
                                transition: 'all 0.3s',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <Radio value={opt.val} style={{ marginRight: 15 }} />
                            <div>
                                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>{opt.label}</div>
                                <div style={{ color: '#888' }}>{opt.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </Radio.Group>
        </div>
    );

    // --- BƯỚC 2: CHỌN TUỔI ---
    const StepAge = () => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Title level={3}>Bạn bao nhiêu tuổi?</Title>
            <Text>Độ tuổi giúp chúng tôi gợi ý từ vựng phù hợp hơn.</Text>
            <div style={{ marginTop: 40, transform: 'scale(1.2)' }}>
                <InputNumber
                    min={5} max={100}
                    value={age}
                    onChange={setAge}
                    size="large"
                    style={{ width: 120, textAlign: 'center' }}
                />
            </div>
            <Text type="secondary" style={{ marginTop: 10 }}>Tuổi</Text>
        </div>
    );

    // --- BƯỚC 3: LÀM BÀI TEST ---
    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get(`/test/placement/${difficulty}`);
            setQuestions(Array.isArray(res) ? res : []);
        } catch (error) {
            console.error(error);
            message.error("Không tải được câu hỏi. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentStep === 2) fetchQuestions();
    }, [currentStep]);

    const handleAnswer = (qId, val) => {
        setAnswers(prev => ({ ...prev, [qId]: val }));
    };

    const StepTest = () => (
        <div style={{ padding: '0 10px' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <Title level={4}>Kiểm tra nhanh</Title>
                <Text type="secondary">Hãy trả lời trung thực để có kết quả chính xác nhất.</Text>
            </div>

            {loading ? (
                // Sửa lỗi Spin warning: Bọc nội dung hoặc dùng Spin đơn giản
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <Spin size="large" />
                    <div style={{ marginTop: 10, color: '#888' }}>Đang tải đề thi...</div>
                </div>
            ) : questions.length === 0 ? (
                <Empty description="Không có câu hỏi nào cho cấp độ này" />
            ) : (
                questions.map((q, index) => (
                    <Card
                        key={q.QuestionID}
                        style={{ marginBottom: 20, borderRadius: 12, border: '1px solid #f0f0f0' }}
                        title={<span style={{ color: '#58cc02' }}>Câu {index + 1}</span>}
                    >
                        <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: 15 }}>
                            {q.QuestionText}
                        </div>
                        <Radio.Group onChange={(e) => handleAnswer(q.QuestionID, e.target.value)} value={answers[q.QuestionID]} style={{ width: '100%' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {['A', 'B', 'C', 'D'].map(optKey => (
                                    <div
                                        key={optKey}
                                        onClick={() => handleAnswer(q.QuestionID, optKey)}
                                        style={{
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: answers[q.QuestionID] === optKey ? '1px solid #58cc02' : '1px solid #d9d9d9',
                                            background: answers[q.QuestionID] === optKey ? '#f6ffed' : '#fff',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <Radio value={optKey}>
                                            <span style={{ fontWeight: 500 }}>{optKey}.</span> {q[`Option${optKey}`]}
                                        </Radio>
                                    </div>
                                ))}
                            </div>
                        </Radio.Group>
                    </Card>
                ))
            )}
        </div>
    );

    // --- XỬ LÝ HOÀN TẤT ---
    const handleFinish = async () => {
        let score = 0;
        if (questions.length > 0) {
            questions.forEach(q => {
                if (answers[q.QuestionID] === q.CorrectAnswer) score++;
            });
        }

        const finalScore = questions.length > 0 ? (score / questions.length) * 100 : 0;
        submitResult(finalScore);
    };

    const submitResult = async (finalScore) => {
        setLoading(true);
        try {
            const res = await axiosClient.post('/users/update-profile', {
                Age: age,
                DifficultyID: difficulty,
                TestScore: finalScore
            });

            // Cập nhật localStorage
            localStorage.setItem('user', JSON.stringify(res.user));

            message.success(`Tuyệt vời! Bạn đạt ${finalScore.toFixed(0)}/100 điểm.`);
            navigate('/learn');
        } catch (error) {
            console.error(error);
            message.error("Lỗi lưu kết quả: " + (error.response?.data?.message || "Lỗi mạng"));
        } finally {
            setLoading(false);
        }
    }

    const steps = [
        { title: 'Trình độ', content: <StepDifficulty /> },
        { title: 'Thông tin', content: <StepAge /> },
        { title: 'Kiểm tra', content: <StepTest /> },
    ];

    return (
        <div style={{ height: '100vh', background: '#f5f5f5', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
            <Card
                style={{
                    width: '100%', maxWidth: 900, height: '90vh', borderRadius: 20,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', overflow: 'hidden'
                }}
                // SỬA LỖI bodyStyle deprecated: Dùng styles.body
                styles={{ body: { display: 'flex', flexDirection: 'column', height: '100%', padding: 0 } }}
            >
                {/* HEADER */}
                <div style={{ padding: '24px 40px', borderBottom: '1px solid #f0f0f0', background: '#fff' }}>
                    <Steps current={currentStep} items={steps.map(s => ({ title: s.title }))} />
                </div>

                {/* BODY (SCROLLABLE) */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '30px 40px', background: '#fff' }}>
                    {steps[currentStep].content}
                </div>

                {/* FOOTER */}
                <div style={{ padding: '20px 40px', borderTop: '1px solid #f0f0f0', background: '#fafafa', display: 'flex', justifyContent: 'space-between' }}>
                    {currentStep > 0 ? (
                        <Button size="large" onClick={() => setCurrentStep(currentStep - 1)}>Quay lại</Button>
                    ) : <div />}

                    {currentStep < steps.length - 1 ? (
                        <Button type="primary" size="large" onClick={() => setCurrentStep(currentStep + 1)} style={{ background: '#58cc02', borderColor: '#58cc02' }}>Tiếp tục</Button>
                    ) : (
                        <Button type="primary" size="large" onClick={handleFinish} loading={loading} style={{ background: '#58cc02', borderColor: '#58cc02' }}>Hoàn tất</Button>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default OnboardingPage;