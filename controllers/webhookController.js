import crypto from "crypto";
import { chatWithAI } from "../services/openaiService.js";

import dotenv from "dotenv";
dotenv.config();

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const GOWA_BASE_URL = process.env.GOWA_BASE_URL; // e.g., http://localhost:3001
const GOWA_DEVICE_ID = process.env.GOWA_DEVICE_ID;

// Middleware to validate HMAC SHA256
export const validateHMAC = (req, res, next) => {
    let signature =
        req.headers["x-signature"] ||
        req.headers["signature"] ||
        req.headers["x-hub-signature-256"];

    if (!signature) {
        console.log("No signature provided");
        return res.status(401).json({ error: "Unauthorized" });
    }

    // Jika pakai x-hub-signature-256, ambil setelah 'sha256='
    let sig = signature;
    if (typeof signature === "string" && signature.startsWith("sha256=")) {
        sig = signature.replace("sha256=", "");
    }

    const body = JSON.stringify(req.body);
    const expectedSignature = crypto
        .createHmac("sha256", WEBHOOK_SECRET)
        .update(body)
        .digest("hex");

    if (
        !crypto.timingSafeEqual(
            Buffer.from(sig, "hex"),
            Buffer.from(expectedSignature, "hex"),
        )
    ) {
        console.log("Invalid signature");
        return res.status(401).json({ error: "Unauthorized" });
    }

    next();
};

// Function to normalize message to plain text
const normalizeMessage = (message) => {
    if (message.conversation) {
        return message.conversation;
    }
    if (message.extendedTextMessage) {
        return message.extendedTextMessage.text;
    }
    // Add more types if needed
    return "[Unsupported message type]";
};

// Function to send message via GoWA
const sendMessage = async (chatJid, text, deviceId) => {
    try {
        // Basic Auth: krTldEWA:6fAOVRW72OY5JJik9AOpPzis
        const basicAuth = Buffer.from(
            "krTldEWA:6fAOVRW72OY5JJik9AOpPzis",
        ).toString("base64");
        const response = await fetch(`${GOWA_BASE_URL}/send/message`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Device-Id": deviceId, // Required for multi-device support
                Authorization: `Basic ${basicAuth}`,
                "ngrok-skip-browser-warning": "true",
            },
            body: JSON.stringify({
                phone: chatJid,
                message: text,
            }),
        });
        if (!response.ok) {
            throw new Error(`Failed to send message: ${response.statusText}`);
        }
        console.log("Message sent successfully");
    } catch (error) {
        console.error("Error sending message:", error);
    }
};

// Webhook handler
export const handleWebhook = async (req, res) => {
    console.log("Webhook called with body:", JSON.stringify(req.body, null, 2));
    try {
        const { event, device_id, payload } = req.body;
        const resolvedNumberId = device_id;
        const resolvedDeviceId = GOWA_DEVICE_ID;

        // Log the event
        console.log(
            `[${new Date().toISOString()}] Event: ${event}, Device: ${resolvedDeviceId}`,
        );

        // Respond quickly
        res.status(200).json({ status: "ok" });

        // Process only message events
        if (event !== "message") {
            return;
        }

        // Extract data (support format baru & lama)
        const senderJid =
            (payload.key && payload.key.remoteJid) ||
            payload.from ||
            payload.chat_id;
        const messageText =
            (payload.message && normalizeMessage(payload.message)) ||
            payload.body;
        const pushName = payload.pushName || payload.from_name || "";

        console.log(`Message from ${pushName} (${senderJid}): ${messageText}`);

        // Process with AI asynchronously
        setImmediate(async () => {
            try {
                const aiResponse = await chatWithAI(messageText);
                console.log(`AI Response: ${aiResponse}`);

                // Optional: Send reply
                if (aiResponse) {
                    await sendMessage(senderJid, aiResponse, resolvedDeviceId);
                }
            } catch (error) {
                console.error("Error processing message with AI:", error);
            }
        });
    } catch (error) {
        console.error("Webhook error:", error);
        // Since we already sent 200, just log
    }
};
