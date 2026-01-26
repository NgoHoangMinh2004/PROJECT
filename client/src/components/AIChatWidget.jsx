import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, Card, List, Typography, Space, Spin, message } from 'antd';
import { RobotOutlined, SendOutlined, CloseOutlined, AudioOutlined } from '@ant-design/icons';
import axiosClient from '../services/axiosClient';

const { Text } = Typography;

// --- HÀM SPEAK SỬ DỤNG GOOGLE TTS (FREE & STABLE) ---
const speak = (text) => {
    if (!text) return;

    // 1. Ngừng các giọng đọc khác
    if (window.responsiveVoice) {
        window.responsiveVoice.cancel();
    }
    window.speechSynthesis.cancel();

    // 2. Xác định ngôn ngữ
    const isEnglish = /^[a-zA-Z0-9\s,.'!?-]*$/.test(text);
    const voice = isEnglish ? "US English Female" : "Vietnamese Female";

    // 3. Gọi lệnh đọc
    if (window.responsiveVoice && window.responsiveVoice.voiceSupport()) {
        window.responsiveVoice.speak(text, voice, {
            rate: 1,
            pitch: 1,
            onstart: () => console.log("AI bắt đầu nói..."),
            onerror: (e) => {
                console.warn("ResponsiveVoice lỗi, dùng dự phòng hệ thống...");
                fallbackSpeak(text, isEnglish);
            }
        });
    } else {
        fallbackSpeak(text, isEnglish);
    }
};

// Hàm dự phòng (Fallback) nếu thư viện không load được
const fallbackSpeak = (text, isEnglish) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = isEnglish ? 'en-US' : 'vi-VN';
    window.speechSynthesis.speak(utterance);
};

const AIChatWidget = () => {
    const [visible, setVisible] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'ai', content: 'Hello! Mình là trợ lý AI. Bạn cần giải thích ngữ pháp hay từ vựng gì không?' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [inputLang, setInputLang] = useState('vi-VN');

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, visible]);

    // --- LOGIC THU ÂM (STT) ---
    const startRecognition = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            message.error("Trình duyệt không hỗ trợ thu âm.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = inputLang;
        recognition.interimResults = false;

        recognition.onstart = () => setIsRecording(true);
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setInputValue(transcript);
            handleSend(transcript);
        };
        recognition.onerror = () => setIsRecording(false);
        recognition.onend = () => setIsRecording(false);
        recognition.start();
    };
    useEffect(() => {
        const handleExternalCommand = (e) => {
            const { message, context } = e.detail;
            setVisible(true); // Mở hộp chat
            if (message) {
                handleSend(message, context); // Bắt AI xử lý nội dung giải thích
            }
        };

        window.addEventListener('OPEN_AI_ASSISTANT', handleExternalCommand);
        return () => window.removeEventListener('OPEN_AI_ASSISTANT', handleExternalCommand);
    }, []);
    const handleSend = async (textOverride, contextOverride) => {
        const textToSend = textOverride || inputValue;
        if (!textToSend.trim() || loading) return;

        const userMsg = { role: 'user', content: textToSend };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setLoading(true);

        try {
            const res = await axiosClient.post('/ai/chat', { message: textToSend });
            const replyText = res.reply || "AI không phản hồi.";

            const aiMsg = { role: 'ai', content: replyText };
            setMessages(prev => [...prev, aiMsg]);

            // GỌI HÀM SPEAK GOOGLE TTS
            speak(replyText);

        } catch (error) {
            const errorMsg = "Xin lỗi, mình đang gặp chút trục trặc kết nối.";
            setMessages(prev => [...prev, { role: 'ai', content: errorMsg }]);
            speak(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', bottom: 30, right: 30, zIndex: 1000 }}>
            {visible && (
                <Card
                    title={
                        <div style={{ color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <span><RobotOutlined /> AI Tutor</span>
                            <CloseOutlined onClick={() => setVisible(false)} style={{ cursor: 'pointer', fontSize: 14 }} />
                        </div>
                    }
                    headStyle={{ background: '#58cc02', padding: '0 15px' }}
                    bodyStyle={{ padding: 0, display: 'flex', flexDirection: 'column', height: 440 }}
                    style={{ width: 350, borderRadius: 15, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}
                >
                    <div style={{ flex: 1, padding: '15px', overflowY: 'auto', background: '#f8fafc' }}>
                        <List
                            dataSource={messages}
                            renderItem={(item) => (
                                <div style={{ display: 'flex', justifyContent: item.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
                                    <div style={{
                                        maxWidth: '85%',
                                        padding: '10px 14px',
                                        borderRadius: '15px',
                                        background: item.role === 'user' ? '#58cc02' : '#fff',
                                        color: item.role === 'user' ? '#fff' : '#334155',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                        fontSize: '14px',
                                        lineHeight: '1.5',
                                        border: item.role === 'ai' ? '1px solid #e2e8f0' : 'none',
                                        borderTopLeftRadius: item.role === 'ai' ? 2 : 15,
                                        borderTopRightRadius: item.role === 'user' ? 2 : 15,
                                    }}>
                                        {item.content}
                                    </div>
                                </div>
                            )}
                        />
                        {loading && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 5 }}>
                                <Spin size="small" />
                                <Text type="secondary" italic style={{ fontSize: 12 }}>AI đang phân tích...</Text>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div style={{ padding: '12px', borderTop: '1px solid #e2e8f0', background: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Button
                            size="small"
                            onClick={() => setInputLang(prev => prev === 'vi-VN' ? 'en-US' : 'vi-VN')}
                            style={{ fontWeight: 'bold', minWidth: 45, borderRadius: 8 }}
                        >
                            {inputLang === 'en-US' ? 'EN' : 'VN'}
                        </Button>

                        <Button
                            shape="circle"
                            danger={isRecording}
                            icon={<AudioOutlined />}
                            onClick={startRecognition}
                            style={{ border: isRecording ? '1px solid red' : 'none', background: isRecording ? '#fff1f0' : '#f1f5f9' }}
                        />

                        <Input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onPressEnter={() => handleSend()}
                            placeholder={inputLang === 'en-US' ? "Talk to me..." : "Hỏi mình bất cứ gì..."}
                            style={{ borderRadius: 20, border: '1px solid #e2e8f0' }}
                        />

                        <Button
                            type="primary"
                            shape="circle"
                            icon={<SendOutlined />}
                            onClick={() => handleSend()}
                            style={{ background: '#58cc02', borderColor: '#58cc02' }}
                        />
                    </div>
                </Card>
            )}

            {!visible && (
                <Button
                    type="primary"
                    shape="circle"
                    style={{ width: 60, height: 60, background: '#58cc02', borderColor: '#58cc02', boxShadow: '0 4px 15px rgba(88, 204, 2, 0.4)' }}
                    onClick={() => setVisible(true)}
                >
                    <RobotOutlined style={{ fontSize: 30 }} />
                </Button>
            )}
        </div>
    );
};

export default AIChatWidget;