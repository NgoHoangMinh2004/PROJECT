// Hàm xử lý đọc văn bản miễn phí và ổn định
const speak = (text) => {
    if (!text) return;

    // 1. Dừng mọi âm thanh đang phát
    window.speechSynthesis.cancel();

    // 2. Kiểm tra ngôn ngữ để chọn giọng đọc
    const isEnglish = /^[a-zA-Z0-9\s,.'!?-]*$/.test(text);
    const lang = isEnglish ? 'en' : 'vi';

    // 3. Sử dụng Google TTS API (Miễn phí và nhanh)
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`;

    const audio = new Audio(url);

    // Tăng tốc độ một chút nếu là tiếng Anh cho tự nhiên
    if (isEnglish) {
        audio.playbackRate = 1.0;
    }

    const silentAudio = new Audio();
    silentAudio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
    silentAudio.play().catch(() => { });

    audio.play().catch(e => {
        console.warn("Cần tương tác với trang web trước khi phát âm thanh", e);
    });
};
export default speak;