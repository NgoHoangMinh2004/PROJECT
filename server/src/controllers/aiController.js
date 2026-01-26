const axios = require('axios');
require('dotenv').config();

const chatWithAI = async (req, res) => {
    // SỬA: Sử dụng alias chuẩn nhất cho v1beta để tránh lỗi 404
    const modelName = "gemini-2.5-flash-lite";

    try {
        const { message, context } = req.body;
        const apiKey = process.env.GOOGLE_API_KEY;

        // Đảm bảo URL chính xác
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        let promptText = `Bạn là gia sư AI của ứng dụng HM Education. `;

        if (context) {
            promptText += `
                Học viên vừa làm sai câu hỏi tiếng Anh: "${context.question}"
                Họ chọn "${context.userAnswer}", đáp án đúng là "${context.correctAnswer}".
                YÊU CẦU:
                1. Giải thích lý do sai bằng TIẾNG VIỆT rõ ràng.
                2. Đưa ra ví dụ minh họa bằng TIẾNG ANH.
                3. TUYỆT ĐỐI KHÔNG dùng ký tự đặc biệt như  **,* **,**",*, #, _, -. Chỉ dùng chữ và dấu chấm câu.`;
        } else {
            promptText += `Hãy trả lời câu hỏi sau bằng tiếng Việt thật dễ hiểu: "${message}"`;
        }

        const payload = {
            contents: [{ parts: [{ text: promptText }] }]
        };

        const response = await axios.post(url, payload, {
            headers: { 'Content-Type': 'application/json' }
        });

        const replyText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "AI không trả lời.";
        res.json({ reply: replyText });

    } catch (error) {
        const status = error.response?.status;
        const errorData = error.response?.data;

        console.error(`AI Error [${status}]:`, JSON.stringify(errorData, null, 2));

        let userMessage = "Lỗi kết nối AI Assistant.";
        if (status === 404) {
            userMessage = "Lỗi cấu hình: Model không khả dụng trên server Google. Vui lòng thử lại sau.";
        } else if (status === 429) {
            userMessage = "Hệ thống AI đang bận (Hết lượt dùng miễn phí). Thử lại sau 1 phút.";
        }

        res.status(status || 500).json({ reply: userMessage });
    }
};

module.exports = { chatWithAI };