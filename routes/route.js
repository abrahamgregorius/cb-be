import express from 'express';
import { getAllUsers } from '../controllers/userController.js';
import { chatWithAI } from '../services/openaiService.js';

const router = express.Router();

router.get('/', getAllUsers);

// Chat with AI
router.post('/chat', async (req, res) => {
    try {
        const { messages, maxTokens, temperature } = req.body;
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages array is required' });
        }
        const response = await chatWithAI(messages, maxTokens, temperature);
        res.json({ response });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Failed to chat with AI' });
    }
});

router.get('/chat', async (req, res) => {
    try {
        let messages = req.query.msg
        let maxTokens = 500
        let temperature = 0.7 
        const response = await chatWithAI(messages, maxTokens, temperature);
        res.json({ response });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Failed to chat with AI' });
    }
});

// Auth Router



// Product Router






export default router;