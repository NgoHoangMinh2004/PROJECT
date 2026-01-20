import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, Card, Avatar, List, Typography, Spin } from 'antd';
import { RobotOutlined, SendOutlined, CloseOutlined, UserOutlined } from '@ant-design/icons';
import axiosClient from '../services/axiosClient';

const { Text } = Typography;

const AIChatWidget = () => {
    const [visible, setVisible] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'ai', content: 'Hello! Thầy là trợ lý AI. Em cần giải thích ngữ pháp hay từ vựng gì không?' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Tự động cuộn xuống cuối khi có tin nhắn mới
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, visible]);

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userMsg = { role: 'user', content: inputValue };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setLoading(true);

        try {
            // Gọi API Backend (Chúng ta sẽ viết ở bước 3)
            const res = await axiosClient.post('/ai/chat', { message: userMsg.content });

            const aiMsg = { role: 'ai', content: res.reply };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            const errorMsg = { role: 'ai', content: 'Xin lỗi, thầy đang bị mất kết nối. Em thử lại sau nhé!' };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', bottom: 30, right: 30, zIndex: 1000 }}>
            {/* 1. KHUNG CHAT (Chỉ hiện khi visible = true) */}
            {visible && (
                <Card
                    style={{
                        width: 350,
                        height: 500,
                        marginBottom: 15,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 15,
                        overflow: 'hidden'
                    }}
                    styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%' } }}
                >
                    {/* Header Chat */}
                    <div style={{ padding: '15px', background: '#58cc02', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', fontSize: 16 }}><RobotOutlined /> AI Tutor</span>
                        <CloseOutlined onClick={() => setVisible(false)} style={{ cursor: 'pointer' }} />
                    </div>

                    {/* Nội dung Chat */}
                    <div style={{ flex: 1, padding: '15px', overflowY: 'auto', background: '#f5f5f5' }}>
                        <List
                            itemLayout="horizontal"
                            dataSource={messages}
                            renderItem={(item) => (
                                <div style={{
                                    display: 'flex',
                                    justifyContent: item.role === 'user' ? 'flex-end' : 'flex-start',
                                    marginBottom: 10
                                }}>
                                    <div style={{
                                        maxWidth: '80%',
                                        padding: '10px 15px',
                                        borderRadius: 15,
                                        background: item.role === 'user' ? '#1890ff' : '#fff',
                                        color: item.role === 'user' ? '#fff' : '#333',
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                                        borderTopLeftRadius: item.role === 'ai' ? 2 : 15,
                                        borderTopRightRadius: item.role === 'user' ? 2 : 15,
                                    }}>
                                        {item.content}
                                    </div>
                                </div>
                            )}
                        />
                        {loading && <div style={{ textAlign: 'left', color: '#888', fontStyle: 'italic' }}>AI đang soạn tin...</div>}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Ô nhập liệu */}
                    <div style={{ padding: '10px', borderTop: '1px solid #f0f0f0', display: 'flex' }}>
                        <Input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onPressEnter={handleSend}
                            placeholder="Hỏi thầy gì đi..."
                            style={{ borderRadius: 20 }}
                        />
                        <Button
                            type="primary"
                            shape="circle"
                            icon={<SendOutlined />}
                            onClick={handleSend}
                            style={{ marginLeft: 10, background: '#58cc02' }}
                        />
                    </div>
                </Card>
            )}

            {/* 2. NÚT TRÒN (FLOATING BUTTON) */}
            {!visible && (
                <Button
                    type="primary"
                    shape="circle"
                    size="large"
                    style={{ width: 60, height: 60, boxShadow: '0 4px 12px rgba(0,0,0,0.2)', background: '#58cc02', borderColor: '#58cc02' }}
                    onClick={() => setVisible(true)}
                >
                    <RobotOutlined style={{ fontSize: 30 }} />
                </Button>
            )}
        </div>
    );
};

export default AIChatWidget;