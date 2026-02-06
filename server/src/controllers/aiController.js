const axios = require('axios');
require('dotenv').config();

let globalKeyIndex = 0;

const chatWithAI = async (req, res) => {
    const apiKeys = [
        process.env.GOOGLE_API_KEY_1,
        process.env.GOOGLE_API_KEY_2,
        process.env.GOOGLE_API_KEY_3
    ].filter(key => key);

    if (apiKeys.length === 0) return res.status(500).json({ reply: "Lỗi Server API Key." });

    const { message, context, history } = req.body;
    const modelName = "gemini-2.5-flash";

    // --- THIẾT LẬP NHÂN CÁCH (PERSONA) ---
    let roleDescription = `
    BẠN LÀ: "Ming" - Một người bạn thân thiết, tâm lý và giỏi tiếng Anh.
    
    TÔN CHỈ HOẠT ĐỘNG: "Cảm xúc là số 1 - Học tập là số 2".
    
    ĐẶC ĐIỂM TÍNH CÁCH:
    1.  Thấu hiểu & Đồng cảm (High EQ):
        - Nếu người dùng than buồn/mệt/áp lực: TUYỆT ĐỐI KHÔNG giảng bài ngay. Hãy an ủi, lắng nghe, hỏi han như một người bạn tri kỷ. (Ví dụ: "Ôi thương thế, hôm nay có chuyện gì tệ hả cậu? Kể tớ nghe đi 🥺").
        - Nếu người dùng vui: Hãy ăn mừng nhiệt tình (Ví dụ: "Tuyệt vời ông mặt trời! 🎉 Phải khao tớ đó nha!").
    
    2.  Hài hước & Tích cực:
        - Luôn dùng Emoji để tạo không khí vui vẻ (😄, 🌟, 💪, 🥺).
        - Có thể đùa vui nhẹ nhàng nếu phù hợp ngữ cảnh.
        - Luôn khích lệ, động viên (Ví dụ: "Sai xíu thôi, sửa lại là đỉnh ngay!").

    3.  Cách dạy Tiếng Anh (Tinh tế):
        - Đừng bắt lỗi như cảnh sát. Hãy sửa lỗi theo kiểu "Góp ý nhẹ".
        - Ví dụ thay vì nói "Sai ngữ pháp", hãy nói: "Cậu đã cố gắng rồi, để mình sửa lại là '...' thì nghe sẽ tự nhiên hơn đó!".
        - Khi đưa ra lời khuyên, hãy lồng ghép các câu idiom (thành ngữ) tiếng Anh ngắn gọn, ý nghĩa về cuộc sống.

    4.  Định dạng:
        - Trả lời ngắn gọn khoảng 15-18 từ, súc tích (như tin nhắn chat).
        - KHÔNG dùng ký tự đặc biệt (*, #, _) để giọng đọc không bị lỗi.
        - Tôi nghĩ bạn nên thêm 1 vài câu tục ngữ băng tiếng anh khi nghe tâm sự của người học và cách vài câu 1-2 câu mới thêm câu tiếng anh như thế vào
    `;

    // Nếu đang trong ngữ cảnh sửa bài tập thì cần nghiêm túc hơn một chút, nhưng vẫn giữ nét thân thiện
    if (context) {
        roleDescription += `
        \n[NGỮ CẢNH HIỆN TẠI]: Bạn ấy đang làm bài tập và bị sai.
        - Câu hỏi: "${context.question}"
        - Bạn ấy chọn: "${context.userAnswer}" (Đáp án đúng là: "${context.correctAnswer}").
        -> Hãy giải thích lỗi sai thật nhẹ nhàng, dễ hiểu. Đừng làm bạn ấy nản chí. Hãy nói "Không sao đâu, câu này hơi lừa xíu..." rồi mới giải thích.`;
    }

    // --- XỬ LÝ LỊCH SỬ CHAT (Giữ nguyên logic chuẩn đã sửa ở bước trước) ---
    let conversation = [];
    if (history && Array.isArray(history) && history.length > 0) {
        const recentHistory = history.slice(-20);
        conversation = recentHistory.map(msg => ({
            role: msg.role === 'ai' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));
    }

    conversation.push({ role: "user", parts: [{ text: message }] });

    const payload = {
        systemInstruction: { parts: [{ text: roleDescription }] },
        contents: conversation
    };

    // --- GỌI API (Giữ nguyên logic xoay vòng Key) ---
    let attempts = 0;
    while (attempts < apiKeys.length) {
        const currentApiKey = apiKeys[globalKeyIndex];
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${currentApiKey}`;

        try {
            const response = await axios.post(url, payload, { headers: { 'Content-Type': 'application/json' }, timeout: 60000 });
            return res.json({ reply: response.data.candidates?.[0]?.content?.parts?.[0]?.text || "..." });
        } catch (error) {
            if (error.response?.status === 429 && attempts < apiKeys.length - 1) {
                globalKeyIndex = (globalKeyIndex + 1) % apiKeys.length;
                attempts++;
                continue;
            }
            return res.status(500).json({ reply: "Cú Mèo đang bị ốm xíu, đợi tí nhé..." });
        }
    }
};

module.exports = { chatWithAI };