const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// Route chat: POST /ai/chat
router.post('/chat', aiController.chatWithAI);

module.exports = router;