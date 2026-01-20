const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// Khởi tạo GenAI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const chatWithAI = async (req, res) => {
    try {
        const { message } = req.body;


        const model = genAI.getGenerativeModel({
            model: "gemini-pro"
        });

        const prompt = `
        Vai trò: Bạn là một giáo viên tiếng Anh thân thiện, nhiệt tình. 
        Nhiệm vụ: Giải thích từ vựng, sửa lỗi ngữ pháp, luyện giao tiếp ngắn gọn và dễ hiểu.
        Yêu cầu: Luôn khuyến khích học sinh. Giải thích bằng tiếng Việt nếu hỏi tiếng Việt.
        
        Câu hỏi của học sinh: "${message}"
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ reply: text });
    } catch (error) {
        console.error("AI Error:", error.message); // Log lỗi gọn hơn
        res.status(500).json({ reply: "Thầy đang bị mất kết nối với máy chủ Google. Em đợi một lát rồi thử lại nhé!" });
    }
};

module.exports = { chatWithAI };