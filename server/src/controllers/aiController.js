const axios = require('axios');
require('dotenv').config();

// Biến toàn cục để theo dõi index của key hiện tại giữa các lần gọi API khác nhau
let globalKeyIndex = 0;

const chatWithAI = async (req, res) => {
    // 1. Cấu hình mảng API Keys từ file .env
    const apiKeys = [
        process.env.GOOGLE_API_KEY_1,
        process.env.GOOGLE_API_KEY_2,
        process.env.GOOGLE_API_KEY_3
    ].filter(key => key); // Lọc bỏ các key bị trống hoặc undefined

    if (apiKeys.length === 0) {
        return res.status(500).json({ reply: "Lỗi: Server chưa cấu hình API Key." });
    }

    const { message, context } = req.body;

    const modelName = "gemini-2.5-flash";

    // 2. Chuẩn bị Prompt
    let promptText = `Bạn là gia sư AI của ứng dụng HM Education. Hãy xưng hô thân thiện. `;
    if (context) {
        promptText += `
            Học viên làm sai câu: "${context.question}"
            Học viên chọn: "${context.userAnswer}", Đáp án đúng: "${context.correctAnswer}".
            YÊU CẦU:
            1. Giải thích lý do sai bằng TIẾNG VIỆT nhẹ nhàng, dễ hiểu.
            2. Đưa ra ví dụ minh họa ngắn gọn bằng TIẾNG ANH.
            3. TUYỆT ĐỐI KHÔNG dùng ký tự đặc biệt như **, #, _, -. Chỉ dùng chữ cái và dấu chấm câu.`;
    } else {
        promptText += `Hãy trả lời ngắn gọn bằng tiếng Việt: "${message}"`;
    }

    const payload = {
        contents: [{ parts: [{ text: promptText }] }]
    };

    // 3. Cơ chế xoay vòng và thử lại (Retry logic)
    let attempts = 0;
    while (attempts < apiKeys.length) {
        // Lấy key hiện tại dựa trên globalKeyIndex
        const currentApiKey = apiKeys[globalKeyIndex];
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${currentApiKey}`;

        try {
            const response = await axios.post(url, payload, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000 // Hủy yêu cầu nếu sau 10s không phản hồi
            });

            const replyText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "AI không trả lời.";
            return res.json({ reply: replyText });

        } catch (error) {
            const status = error.response?.status;

            // Nếu gặp lỗi 429 (Hết quota), đổi sang key tiếp theo và thử lại ngay
            if (status === 429 && attempts < apiKeys.length - 1) {
                console.warn(`Key số ${globalKeyIndex + 1} hết hạn mức. Đang thử Key tiếp theo...`);
                globalKeyIndex = (globalKeyIndex + 1) % apiKeys.length;
                attempts++;
                continue; // Tiếp tục vòng lặp while với key mới
            }

            // Nếu là lỗi khác (404, 400...) hoặc đã hết sạch các key để thử
            console.error(`AI Error [${status}]:`, error.response?.data || error.message);

            let userMessage = "HM Tutor đang bận một chút, bạn thử lại sau 30 giây nhé!";
            if (status === 404) userMessage = "Model AI không tồn tại hoặc sai URL.";

            return res.status(status || 500).json({ reply: userMessage });
        }
    }
};

module.exports = { chatWithAI };