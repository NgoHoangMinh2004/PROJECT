// Hàm xử lý đọc văn bản 
const speak = (text) => {
    if (!text) return;

    // 1. Dừng mọi âm thanh đang phát
    window.speechSynthesis.cancel();

    // 2. Kiểm tra ngôn ngữ để chọn giọng đọc
    const isEnglish = /^[a-zA-Z0-9\s,.'!?-]*$/.test(text);
    const lang = isEnglish ? 'en' : 'vi';

    // 3. Sử dụng Google TTS API 
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`;

    const audio = new Audio(url);

    // Tốc độ đọc Tiếng Anh
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