// Trong file AIChatDrawer.jsx hoặc file xử lý logic AI của bạn

const speak = (text) => {
    // 1. Hủy các yêu cầu đọc đang dang dở để tránh chồng chéo âm thanh
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // 2. Lấy danh sách giọng đọc của hệ thống
    const voices = window.speechSynthesis.getVoices();

    // 3. Tìm kiếm giọng tiếng Việt chuẩn
    // Thường là Google Tiếng Việt (trên Chrome) hoặc Microsoft An (trên Edge)
    const vietnameseVoice = voices.find(voice =>
        voice.lang === 'vi-VN' || voice.lang.includes('vi')
    );

    if (vietnameseVoice) {
        utterance.voice = vietnameseVoice;
        utterance.lang = 'vi-VN';
    } else {
        // Nếu không có giọng Việt, vẫn để vi-VN để trình duyệt cố gắng giả lập
        utterance.lang = 'vi-VN';
    }

    // 4. Cấu hình tốc độ (rate) và độ cao (pitch)
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    window.speechSynthesis.speak(utterance);
};