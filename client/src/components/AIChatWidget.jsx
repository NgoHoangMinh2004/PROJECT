import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, Card, List, Typography, Space, Spin, message, Tooltip, Popconfirm } from 'antd';
import { RobotOutlined, SendOutlined, CloseOutlined, AudioOutlined, DeleteOutlined } from '@ant-design/icons';
import axiosClient from '../services/axiosClient';

const { Text } = Typography;

// --- GIỮ NGUYÊN HÀM SPEAK CŨ CỦA BẠN ---
const speak = async (text) => {
    if (!text) return;
    if (window.responsiveVoice) window.responsiveVoice.cancel();
    window.speechSynthesis.cancel();

    const isEnglish = /^[a-zA-Z0-9\s,.'!?-]*$/.test(text);
    const lang = isEnglish ? 'en' : 'vi';
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`;

    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        audio.onended = () => URL.revokeObjectURL(audioUrl);
        await audio.play();
    } catch (e) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang === 'en' ? 'en-US' : 'vi-VN';
        window.speechSynthesis.speak(utterance);
    }
};

const AIChatWidget = () => {
    const [visible, setVisible] = useState(false);

    // --- 1. SỬA: KHỞI TẠO TỪ LOCALSTORAGE ---
    const [messages, setMessages] = useState(() => {
        const savedChat = localStorage.getItem('hm_chat_history');
        if (savedChat) {
            return JSON.parse(savedChat);
        } else {
            return [{ role: 'ai', content: 'Chào bạn! Mình là HM Tutor. Chúc bạn học tốt!' }];
        }
    });

    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [inputLang, setInputLang] = useState('vi-VN');

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // --- 2. SỬA: TỰ ĐỘNG LƯU KHI TIN NHẮN THAY ĐỔI ---
    useEffect(() => {
        // Lưu mảng messages vào LocalStorage mỗi khi nó thay đổi
        localStorage.setItem('hm_chat_history', JSON.stringify(messages));
        scrollToBottom();
    }, [messages, visible]);

    // Lắng nghe lệnh từ bên ngoài (Giữ nguyên)
    useEffect(() => {
        const handleExternalCommand = (e) => {
            const { message: msg, context } = e.detail;
            setVisible(true);
            if (msg) handleSend(msg, context);
        };
        window.addEventListener('OPEN_AI_ASSISTANT', handleExternalCommand);
        return () => window.removeEventListener('OPEN_AI_ASSISTANT', handleExternalCommand);
    }, []);

    // --- 3. THÊM: HÀM XÓA LỊCH SỬ ---
    const clearHistory = () => {
        const defaultMsg = [{ role: 'ai', content: 'Chào bạn! Mình là HM Tutor. Chúc bạn học tốt!' }];
        setMessages(defaultMsg);
        localStorage.removeItem('hm_chat_history');
        message.success("Đã xóa lịch sử trò chuyện.");
    };

    const startRecognition = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return message.error("Trình duyệt không hỗ trợ thu âm.");

        const recognition = new SpeechRecognition();
        recognition.lang = inputLang;
        recognition.onstart = () => setIsRecording(true);
        recognition.onresult = (e) => setInputValue(e.results[0][0].transcript);
        recognition.onend = () => setIsRecording(false);
        recognition.start();
    };

    const handleSend = async (textOverride, contextOverride) => {
        const textToSend = textOverride || inputValue;
        if (!textToSend.trim() || loading) return;

        if (!textOverride) {
            setMessages(prev => [...prev, { role: 'user', content: textToSend }]);
        }
        setInputValue('');
        setLoading(true);

        try {
            const res = await axiosClient.post('/ai/chat', {
                message: textToSend,
                context: contextOverride
            });
            const reply = res.reply || "AI không phản hồi.";
            setMessages(prev => [...prev, { role: 'ai', content: reply }]);
            speak(reply);
        } catch (error) {
            const msg = error.response?.status === 429
                ? "Hệ thống bận, vui lòng thử lại sau 10s!"
                : "Lỗi kết nối AI.";
            setMessages(prev => [...prev, { role: 'ai', content: msg }]);
            speak(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', bottom: 30, right: 30, zIndex: 9999 }}>
            {visible && (
                <Card
                    title={
                        <div style={{ color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 'bold' }}><RobotOutlined /> HM AI Tutor</span>

                            {/* --- NÚT CÔNG CỤ TRÊN HEADER --- */}
                            <div style={{ display: 'flex', gap: 10 }}>
                                <Popconfirm
                                    title="Xóa lịch sử chat?"
                                    onConfirm={clearHistory}
                                    okText="Xóa"
                                    cancelText="Hủy"
                                >
                                    <Tooltip title="Xóa lịch sử">
                                        <DeleteOutlined style={{ cursor: 'pointer', color: '#fff' }} />
                                    </Tooltip>
                                </Popconfirm>
                                <CloseOutlined onClick={() => setVisible(false)} style={{ cursor: 'pointer' }} />
                            </div>
                        </div>
                    }
                    styles={{
                        header: { background: '#58cc02', padding: '0 15px', minHeight: '45px' },
                        body: { padding: 0, display: 'flex', flexDirection: 'column', height: 440 }
                    }}
                    style={{ width: 350, borderRadius: 15, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}
                >
                    <div style={{ flex: 1, padding: '15px', overflowY: 'auto', background: '#f8fafc' }}>
                        {messages.map((item, index) => (
                            <div key={index} style={{ display: 'flex', justifyContent: item.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
                                <div style={{
                                    maxWidth: '85%', padding: '10px 14px', borderRadius: '15px',
                                    background: item.role === 'user' ? '#58cc02' : '#fff',
                                    color: item.role === 'user' ? '#fff' : '#334155',
                                    border: item.role === 'ai' ? '1px solid #e2e8f0' : 'none',
                                    borderTopRightRadius: item.role === 'user' ? '4px' : '15px',
                                    borderTopLeftRadius: item.role === 'ai' ? '4px' : '15px',
                                    fontSize: '14px', lineHeight: '1.5',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                }}>
                                    {item.content}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 5 }}>
                                <Spin size="small" />
                                <Text type="secondary" italic style={{ fontSize: 12 }}>AI đang suy nghĩ...</Text>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div style={{ padding: '12px', borderTop: '1px solid #e2e8f0', background: '#fff', display: 'flex', gap: '8px' }}>
                        <Button size="small" onClick={() => setInputLang(prev => prev === 'vi-VN' ? 'en-US' : 'vi-VN')} style={{ borderRadius: 8 }}>
                            {inputLang === 'en-US' ? 'EN' : 'VN'}
                        </Button>
                        <Button shape="circle" danger={isRecording} icon={<AudioOutlined />} onClick={startRecognition} />
                        <Input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onPressEnter={() => handleSend()}
                            placeholder="Hỏi mình bất cứ gì..."
                            style={{ borderRadius: 20 }}
                        />
                        <Button type="primary" shape="circle" icon={<SendOutlined />} onClick={() => handleSend()} style={{ background: '#58cc02' }} />
                    </div>
                </Card>
            )}

            {!visible && (
                <Button type="primary" shape="circle" style={{ width: 60, height: 60, background: '#58cc02', boxShadow: '0 4px 15px rgba(88, 204, 2, 0.4)' }} onClick={() => setVisible(true)}>
                    <RobotOutlined style={{ fontSize: 30 }} />
                </Button>
            )}
        </div>
    );
};

export default AIChatWidget;