import express from 'express';
import { getAllUsers } from '../controllers/userController.js';
import { chatWithAI } from '../services/openaiService.js';
import { handleWebhook, validateHMAC } from '../controllers/webhookController.js';

const router = express.Router();

router.get('/', getAllUsers);

// Chat with AI
router.post('/chat', async (req, res) => {
    try {
        let { messages, maxTokens, temperature } = req.body;
        // Accept string or array, always convert to string for now
        if (!messages) {
            return res.status(400).json({ error: 'Messages is required' });
        }
        if (Array.isArray(messages)) {
            messages = messages.map(m => (typeof m === 'string' ? m : JSON.stringify(m))).join('\n');
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

// Webhook route
router.post('/webhook', validateHMAC, handleWebhook);

// Test webhook without HMAC for debugging
router.post('/webhook-test', (req,res) => {
    console.log("Headers:", req.headers);
    handleWebhook
});

// Auth Router



// Product Router






export default router;