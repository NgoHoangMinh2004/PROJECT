import React, { useState, useRef, useEffect } from 'react';
import { Input, Card, message, Tooltip, Popconfirm } from 'antd';
import { CloseOutlined, DeleteOutlined, AudioOutlined, LoadingOutlined, RobotOutlined } from '@ant-design/icons';
import axiosClient from '../services/axiosClient';

const AIChatWidget = () => {
    // --- STATE ---
    const [visible, setVisible] = useState(false);
    const [messages, setMessages] = useState(() => {
        try {
            const saved = localStorage.getItem('hm_chat_history');
            return saved ? JSON.parse(saved) : [{ role: 'ai', content: 'Chào bạn! Mình là Minh.' }];
        } catch { return []; }
    });
    const [inputValue, setInputValue] = useState('');

    // UI STATES
    const [isListening, setIsListening] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [conversationMode, setConversationMode] = useState(false);

    // REFS (Quản lý logic ngầm)
    const recognitionRef = useRef(null);
    const silenceTimerRef = useRef(null);
    const messagesEndRef = useRef(null);
    const textBufferRef = useRef('');
    const isSendingRef = useRef(false);

    // [QUAN TRỌNG] Ref để giữ giá trị State luôn mới nhất trong các hàm Callback
    const conversationModeRef = useRef(false);
    const utteranceRef = useRef(null); // Giữ giọng đọc không bị Chrome xóa

    const characterImage = "https://cdn-icons-png.flaticon.com/512/4712/4712035.png";

    // Update Ref khi State đổi
    useEffect(() => { conversationModeRef.current = conversationMode; }, [conversationMode]);

    // Auto scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        localStorage.setItem('hm_chat_history', JSON.stringify(messages));
    }, [messages, visible]);

    // --- TTS (ĐỌC) - PHIÊN BẢN CHỐNG LỖI ---
    const speak = (text, onFinished) => {
        if (!text) { if (onFinished) onFinished(); return; }

        // Hủy các giọng đọc cũ đang treo
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'vi-VN';
        utterance.rate = 1.1;

        // [FIX LỖI CHROME]: Gán vào Ref để không bị Garbage Collection xóa
        utteranceRef.current = utterance;

        utterance.onend = () => {
            console.log("🗣️ Đã đọc xong.");
            if (onFinished) onFinished();
        };

        utterance.onerror = (e) => {
            console.error("Lỗi đọc:", e);
            if (onFinished) onFinished();
        };

        window.speechSynthesis.speak(utterance);
    };

    // --- MICROPHONE ENGINE ---
    const startListening = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        // Nếu Mic đã có và đang chạy (state không phải đã tắt), thì không start lại
        // Tuy nhiên ở đây ta dùng recognitionRef để check instance
        if (recognitionRef.current) {
            try { recognitionRef.current.abort(); } catch (e) { }
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'vi-VN';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onstart = () => {
            console.log("🎙️ Mic ĐÃ BẬT - Sẵn sàng nghe");
            setIsListening(true);
        };

        recognition.onend = () => {
            console.log("⏹️ Mic ĐÃ TẮT");
            setIsListening(false);
            recognitionRef.current = null;

            // LOGIC TỰ ĐỘNG BẬT LẠI (Auto-Resume)
            // Chỉ bật lại nếu:
            // 1. Đang ở chế độ hội thoại (conversationModeRef.current = true)
            // 2. Không phải đang gửi tin nhắn (isSendingRef.current = false)
            // 3. AI không đang suy nghĩ (isThinking = false)
            if (conversationModeRef.current && !isSendingRef.current && !isThinking) {
                console.log("🔄 Mic tắt bất ngờ -> Tự động bật lại sau 0.5s...");
                setTimeout(startListening, 500);
            }
        };

        recognition.onresult = (event) => {
            const resultIndex = event.resultIndex;
            const transcript = event.results[resultIndex][0].transcript.toLowerCase().trim();
            const isFinal = event.results[resultIndex].isFinal;

            setInputValue(transcript);
            textBufferRef.current = transcript;

            // --- LOGIC 1.2 GIÂY IM LẶNG ---
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

            silenceTimerRef.current = setTimeout(() => {
                // Chỉ gửi nếu có nội dung
                if (textBufferRef.current.length > 0 && !isSendingRef.current) {
                    console.log("⏳ Hết 1.2s -> Chốt đơn:", textBufferRef.current);

                    isSendingRef.current = true; // Khóa gửi

                    // Dừng Mic thủ công để tránh thu tạp âm lúc AI đang xử lý
                    if (recognitionRef.current) recognitionRef.current.stop();

                    handleSend(textBufferRef.current);
                }
            }, 1200);
        };

        try {
            recognition.start();
            recognitionRef.current = recognition;
        } catch (e) {
            console.error("Lỗi bật Mic:", e);
        }
    };

    const stopListening = () => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        if (recognitionRef.current) recognitionRef.current.abort();
        recognitionRef.current = null;
        setIsListening(false);
    };

    // --- SEND LOGIC ---
    const handleSend = async (text) => {
        if (!text.trim()) return;

        setIsThinking(true);
        setInputValue('');
        textBufferRef.current = '';

        // UI User
        setMessages(prev => [...prev, { role: 'user', content: text }]);

        try {
            const historyToSend = messages.slice(-10);
            // Gửi request lên server
            const res = await axiosClient.post('/ai/chat', { message: text, history: historyToSend });

            const reply = res.reply || "Minh chưa nghĩ ra câu trả lời.";
            setMessages(prev => [...prev, { role: 'ai', content: reply }]);

            speak(reply, () => {
                isSendingRef.current = false;
                setIsThinking(false);
                if (conversationModeRef.current) startListening();
            });

        } catch (error) {
            let errorMsg = "Lỗi kết nối Server.";

            // Kiểm tra nếu là lỗi 429 (Hết lượt) từ Backend gửi về
            if (error.response && error.response.status === 429) {
                // Lấy câu thông báo "Hic, Minh nói chuyện nhiều quá..." từ Backend
                errorMsg = error.response.data.reply || "Server đang quá tải, thử lại sau nhé!";
            } else if (error.response && error.response.data && error.response.data.reply) {
                // Các lỗi khác có tin nhắn từ server (ví dụ lỗi 500 do sai model)
                errorMsg = error.response.data.reply;
            }

            // Hiện tin nhắn lỗi vào khung chat như một lời thoại của AI
            setMessages(prev => [...prev, { role: 'ai', content: errorMsg }]);

            speak(errorMsg, () => {
                isSendingRef.current = false;
                setIsThinking(false);
                // Vẫn cho phép bật lại mic để người dùng thử lại sau
                if (conversationModeRef.current) startListening();
            });
        }
    };

    // --- TOGGLE CHẾ ĐỘ RẢNH TAY ---
    const toggleConversation = () => {
        if (conversationMode) {
            // TẮT
            setConversationMode(false); // Ref sẽ tự update qua useEffect
            stopListening();
            window.speechSynthesis.cancel();
            message.info("Đã tắt chế độ rảnh tay.");
        } else {
            // BẬT
            setConversationMode(true);
            // setConversationMode là bất đồng bộ, nên ta dùng biến tạm hoặc Ref nếu cần logic ngay
            conversationModeRef.current = true;

            const greeting = "Bắt đầu hội thoại. Bạn nói đi...";
            speak(greeting, () => {
                startListening();
            });
            message.success("Chế độ rảnh tay đã bật!");
        }
    };

    const clearHistory = () => {
        setMessages([{ role: 'ai', content: 'Chào bạn! Mình là Ming.' }]);
        localStorage.removeItem('hm_chat_history');
        message.success("Đã làm mới.");
    };

    return (
        <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>

            {visible && (
                <Card
                    title={
                        <div style={{ color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 'bold' }}>🤖 Trợ lý Ming</span>
                            <CloseOutlined onClick={() => { setVisible(false); setConversationMode(false); stopListening(); }} style={{ color: '#fff', cursor: 'pointer' }} />
                        </div>
                    }
                    styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', height: 400 }, header: { background: '#58cc02', padding: '0 15px' } }}
                    style={{ width: 340, marginBottom: 15, borderRadius: 15, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}
                >
                    <div style={{ flex: 1, padding: '15px', overflowY: 'auto', background: '#f5f5f5' }}>
                        {messages.map((item, index) => (
                            <div key={index} style={{ display: 'flex', justifyContent: item.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
                                {item.role === 'ai' && <img src={characterImage} alt="AI" style={{ width: 28, height: 28, marginRight: 8, borderRadius: '50%' }} />}
                                <div style={{
                                    maxWidth: '80%', padding: '10px 14px', borderRadius: '15px',
                                    background: item.role === 'user' ? '#58cc02' : '#fff',
                                    color: item.role === 'user' ? '#fff' : '#333',
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                                }}>
                                    {item.content}
                                </div>
                            </div>
                        ))}

                        {/* TRẠNG THÁI MIC REAL-TIME */}
                        {isListening && (
                            <div style={{ color: '#58cc02', fontStyle: 'italic', fontSize: 12, padding: 10, textAlign: 'right' }}>
                                🎙️ {inputValue || "Đang lắng nghe..."}
                            </div>
                        )}
                        {isThinking && <div style={{ padding: 10, fontSize: 12, color: '#888' }}>Mình đang suy nghĩ, bạn đợi 1 xíu nhé...</div>}
                        <div ref={messagesEndRef} />
                    </div>

                    <div style={{ padding: 10, background: '#fff', display: 'flex', gap: 5, borderTop: '1px solid #eee' }}>
                        <Input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={isListening ? "Đang nghe bạn nói..." : "Nhập tin nhắn..."}
                            disabled={isListening}
                            onPressEnter={() => handleSend(inputValue)}
                            style={{ borderRadius: 20 }}
                        />

                        {/* NÚT MIC THẦN THÁNH */}
                        <div
                            onClick={toggleConversation}
                            style={{
                                cursor: 'pointer', width: 40, height: 32, borderRadius: '20px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: conversationMode ? '#ff4d4f' : '#f0f0f0',
                                color: conversationMode ? '#fff' : '#666',
                                transition: 'all 0.3s',
                                boxShadow: conversationMode ? '0 0 10px rgba(255, 77, 79, 0.5)' : 'none'
                            }}
                        >
                            {isThinking ? <LoadingOutlined /> : <AudioOutlined spin={isListening} />}
                        </div>
                    </div>
                </Card>
            )}

            {/* AVATAR TRIGGER */}
            <div onClick={() => setVisible(!visible)} className="ai-avatar-trigger" style={{ cursor: 'pointer' }}>
                <img src={characterImage} alt="AI" style={{ width: 70, height: 70, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }} />
            </div>
        </div>
    );
};

export default AIChatWidget;