import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, Card, List, Typography, Space, Spin } from 'antd';
import { RobotOutlined, SendOutlined, CloseOutlined, AudioOutlined } from '@ant-design/icons';
import axiosClient from '../services/axiosClient';

const { Text } = Typography;

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

    // --- KHỞI TẠO GIỌNG ĐỌC NGAY KHI VÀO APP ---
    useEffect(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.getVoices();
            const forceLoad = () => window.speechSynthesis.getVoices();
            window.speechSynthesis.onvoiceschanged = forceLoad;
        }
    }, []);

    const isVietnamese = (text) => {
        const vietnameseRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
        return vietnameseRegex.test(text);
    };

    // --- LOGIC PHÁT ÂM (TTS) THÔNG MINH ---
    const speak = (text) => {
        if (!window.speechSynthesis) return;

        // Dừng âm thanh cũ
        window.speechSynthesis.cancel();

        // Hàm đợi danh sách giọng load xong
        const loadVoicesAndSpeak = () => {
            const voices = window.speechSynthesis.getVoices();

            // Nếu chưa thấy giọng nào, đợi 50ms rồi thử lại
            if (voices.length === 0) {
                setTimeout(loadVoicesAndSpeak, 50);
                return;
            }

            // Tách câu để đọc lần lượt: Tiếng Việt giọng Việt, Anh giọng Anh
            const chunks = text.split(/([.\n!?;]+)/).filter(c => c.trim().length > 0);

            let queue = [];

            // TÌM GIỌNG VIỆT (Ưu tiên Microsoft An/HoaiMy vừa cài)
            const viVoice = voices.find(v => v.name.includes('Microsoft An')) ||
                voices.find(v => v.name.includes('Microsoft HoaiMy')) ||
                voices.find(v => v.lang === 'vi-VN');

            // TÌM GIỌNG ANH
            const enVoice = voices.find(v => v.name.includes('Google US English')) ||
                voices.find(v => v.name.includes('Microsoft David')) ||
                voices.find(v => v.lang === 'en-US');

            chunks.forEach(chunk => {
                if (chunk.match(/^[.\n!?;]+$/)) return; // Bỏ qua dấu câu đứng riêng

                const utterance = new SpeechSynthesisUtterance(chunk);

                // Nếu là tiếng Việt (dùng hàm kiểm tra Regex)
                if (isVietnamese(chunk)) {
                    utterance.lang = 'vi-VN';
                    if (viVoice) {
                        utterance.voice = viVoice;
                    } else {
                        // Nếu vẫn chưa cài giọng, báo lỗi nhẹ console
                        console.warn("Chưa cài giọng Tiếng Việt trong Windows Settings!");
                    }
                    utterance.rate = 1.0;
                }
                // Nếu là tiếng Anh
                else {
                    utterance.lang = 'en-US';
                    if (enVoice) utterance.voice = enVoice;
                    utterance.rate = 0.9;
                }

                queue.push(utterance);
            });

            // Hàm chạy hàng đợi đọc
            const playQueue = (index) => {
                if (index >= queue.length) return;
                const u = queue[index];
                u.onend = () => playQueue(index + 1);
                window.speechSynthesis.speak(u);
            };

            if (queue.length > 0) playQueue(0);
        };

        loadVoicesAndSpeak();
    };

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

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, visible]);

    const handleSend = async (textOverride) => {
        const textToSend = textOverride || inputValue;
        if (!textToSend.trim() || loading) return;

        const userMsg = { role: 'user', content: textToSend };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setLoading(true);

        try {
            // Lưu ý: Gửi message kèm context nếu cần ở đây
            const res = await axiosClient.post('/ai/chat', { message: textToSend });
            const replyText = res.reply || res.data?.reply || "AI không phản hồi.";

            const aiMsg = { role: 'ai', content: replyText };
            setMessages(prev => [...prev, aiMsg]);

            // AI bắt đầu nói
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
                            icon={<AudioOutlined className={isRecording ? 'animate-pulse' : ''} />}
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