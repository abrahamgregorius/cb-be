import OpenAI from "openai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize client with SumoPod AI
const openai = new OpenAI({
    apiKey: process.env.AI_API_KEY,
    baseURL: "https://ai.sumopod.com/v1",
});

// Function to chat with GPT-4o-mini
// List of allowed intents
const ALLOWED_INTENTS = [
    "transaction_status",
    "settlement_delay",
    "refund_request",
    "chargeback",
    "technical_issue",
    "account_issue",
];

// Helper to validate and standardize AI output
function validateAIOutput(aiJson) {
    // Intent must be one of allowed
    if (!ALLOWED_INTENTS.includes(aiJson.intent)) {
        aiJson.intent = "technical_issue"; // fallback
    }
    // Ensure all required fields exist
    const requiredFields = [
        "intent",
        "priority",
        "confidence",
        "needs_human",
        "escalation_ready",
        "transaction_id",
        "summary",
    ];
    for (const field of requiredFields) {
        if (!(field in aiJson)) {
            aiJson[field] = null;
        }
    }
    return aiJson;
}

// Structured system prompt for OpenAI
const SYSTEM_PROMPT = `
Kamu adalah AI Copilot untuk layanan pembayaran digital. Selalu output dalam format JSON dengan field berikut:
{
  "intent": string (pilih salah satu: transaction_status, settlement_delay, refund_request, chargeback, technical_issue, account_issue),
  "priority": string (low, medium, high, critical),
  "confidence": number (0-1),
  "needs_human": boolean,
  "escalation_ready": boolean,
  "transaction_id": string/null,
  "summary": string
}
Jangan pernah buat kategori intent baru. Jika intent tidak jelas, gunakan "technical_issue". Selalu isi semua field. Jangan pernah output selain JSON.
`;

export const chatWithAI = async (
    messages,
    maxTokens = 200,
    temperature = 0.7,
) => {
    try {
        // Always send system prompt and user message
        const response = await openai.chat.completions.create({
            model: "seed-2-0-mini",
            messages: [
                {
                    role: "system",
                    content: SYSTEM_PROMPT,
                },
                { role: "user", content: messages },
            ],
            max_tokens: maxTokens,
            temperature: temperature,
            response_format: { type: "json_object" },
        });
        let aiJson;
        try {
            aiJson = JSON.parse(response.choices[0].message.content);
        } catch (e) {
            // fallback: wrap as technical_issue
            aiJson = {
                intent: "technical_issue",
                priority: "high",
                confidence: 0.5,
                needs_human: true,
                escalation_ready: false,
                transaction_id: null,
                summary: "AI output tidak valid JSON. Mohon cek sistem.",
            };
        }
        return validateAIOutput(aiJson);
    } catch (error) {
        console.error("Error chatting with AI:", error);
        throw error;
    }
};
