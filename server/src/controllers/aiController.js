const axios = require('axios');
require('dotenv').config();

const chatWithAI = async (req, res) => {

    const modelName = "gemini-flash-latest";

    try {
        const { message } = req.body;
        const apiKey = process.env.GOOGLE_API_KEY;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        const payload = {
            contents: [
                {
                    parts: [
                        {
                            text: `Bạn là giáo viên tiếng Anh. Hãy trả lời thật là dễ hiểu và đáng yêu: "${message}"`
                        }
                    ]
                }
            ]
        };

        const response = await axios.post(url, payload, {
            headers: { 'Content-Type': 'application/json' }
        });

        const replyText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "AI không trả lời.";

        res.json({ reply: replyText });

    } catch (error) {
        const status = error.response?.status;
        const errorData = error.response?.data;

        // Log lỗi ra console để debug
        console.error(`AI Error [${status}]:`, JSON.stringify(errorData, null, 2));

        let userMessage = "Lỗi kết nối AI.";

        // Xử lý thông báo lỗi an toàn (vì modelName đã được khai báo bên ngoài)
        if (status === 404) {
            userMessage = `Lỗi 404: Không tìm thấy model '${modelName}'.`;
        } else if (status === 429) {
            userMessage = "Lỗi 429: Tài khoản Google này chưa được cấp quyền dùng Model này (Quota = 0).";
        } else if (status === 400) {
            userMessage = "Lỗi 400: API Key không hợp lệ.";
        }

        res.status(500).json({ reply: userMessage });
    }
};

module.exports = { chatWithAI };