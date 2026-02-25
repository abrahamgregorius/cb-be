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
export const chatWithAI = async (
    messages,
    maxTokens = 150,
    temperature = 0.7,
) => {
    try {
        const response = await openai.chat.completions.create({
            model: "seed-2-0-mini",
            messages: [
                { role: "user", content: messages },
            ],
            max_tokens: maxTokens,
            temperature: temperature,
        });
        return response.choices[0].message.content;
    } catch (error) {
        console.error("Error chatting with AI:", error);
        throw error;
    }
};
