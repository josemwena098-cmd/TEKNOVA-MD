const { cmd } = require("../command");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

// T20-CLASSIC AI API Configuration
const CHATGPT_API = "https://arimuqnlsqzunbqovakc.supabase.co/functions/v1/whatsapp-chat";

// History file path
const HISTORY_FILE = path.join(__dirname, '../data/chatbot_history.json');

// Store chatbot state and conversation history
const chatbotEnabled = new Map();
const lastReplyTime = new Map();
const conversationHistory = new Map();
const userLastActivity = new Map();
const REPLY_INTERVAL = 10000;
const HISTORY_RETENTION_MS = 72 * 60 * 60 * 1000; // 72 hours

// Helper function to check if message is from the bot itself
function isFromBot(mek, conn) {
    if (!mek || !conn) return false;
    
    // Check if message is marked as from bot
    if (mek.key?.fromMe) return true;
    
    // Get bot's JID
    const botJid = conn.user?.id;
    if (!botJid) return false;
    
    // Get sender's JID from the message
    const senderJid = mek.key?.participant || mek.key?.remoteJid;
    if (!senderJid) return false;
    
    // Normalize and compare JIDs
    const botNumber = botJid.split(':')[0].split('@')[0];
    const senderNumber = senderJid.split(':')[0].split('@')[0];
    
    return botNumber === senderNumber;
}

// Load history from file
function loadHistory() {
    try {
        if (fs.existsSync(HISTORY_FILE)) {
            const data = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
            const now = Date.now();

            // Filter out old entries
            const filtered = {};
            for (const [user, entry] of Object.entries(data)) {
                if (now - entry.lastActivity < HISTORY_RETENTION_MS) {
                    conversationHistory.set(user, entry.history);
                    userLastActivity.set(user, entry.lastActivity);
                }
            }
            console.log(`Loaded chatbot history for ${Object.keys(filtered).length} users`);
        }
    } catch (error) {
        console.error('Error loading chatbot history:', error);
    }
}

// Save history to file
function saveHistory() {
    try {
        const data = {};
        for (const [user, history] of conversationHistory) {
            const lastActivity = userLastActivity.get(user) || Date.now();
            data[user] = {
                history: history,
                lastActivity: lastActivity
            };
        }
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving chatbot history:', error);
    }
}

// Load history on startup
loadHistory();

// Save history every 5 minutes
setInterval(saveHistory, 5 * 60 * 1000);

// Function to get AI response
async function getAIResponse(user, message) {
    try {
        if (!conversationHistory.has(user)) {
            conversationHistory.set(user, []);
        }
        const history = conversationHistory.get(user);

        history.push({ role: "user", content: message });

        if (history.length > 10) {
            history.splice(0, history.length - 10);
        }

        const response = await axios.post(CHATGPT_API, {
            message: message,
            conversation_id: user
        }, {
            timeout: 60000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        let aiResponse = response.data?.reply || "Sorry, I'm having trouble responding right now.";

        if (typeof aiResponse !== "string") {
            aiResponse = String(aiResponse);
        }

        history.push({ role: "assistant", content: aiResponse });

        // Update last activity
        userLastActivity.set(user, Date.now());

        // Save history
        saveHistory();

        return aiResponse;

    } catch (error) {
        console.error("Chatbot AI error:", error.message);
        return "Sorry, I'm having trouble responding right now. Please try again later.";
    }
}

// Toggle chatbot command
cmd({
    pattern: "chatbot",
    alias: ["cb"],
    react: "🤖",
    desc: "Toggle AI chatbot for PM conversations",
    category: "ai",
    filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
    const user = sender.split('@')[0];
    const isGroup = from.endsWith('@g.us');

    if (isGroup) {
        return reply("❌ Chatbot can only be used in private messages.");
    }

    const current = chatbotEnabled.get(user) || false;
    chatbotEnabled.set(user, !current);

    if (!current) {
        conversationHistory.set(user, []);
        lastReplyTime.set(user, 0);
        userLastActivity.set(user, Date.now());
        reply("✅ *T20-CLASSIC AI Chatbot Enabled*\n\nI will now respond to your messages in this private chat. Send me anything to start a conversation!\n\nUse .chatbot again to disable.");
    } else {
        reply("❌ *Chatbot Disabled*\n\nI will no longer auto-respond in this chat.");
    }
});

// Auto-reply handler
async function handleChatbotMessage(conn, mek, m, { from, sender, body }) {
    // Don't respond to bot's own messages
    if (mek.key?.fromMe || isFromBot(mek, conn)) return;
    
    const user = sender.split('@')[0];
    const isGroup = from.endsWith('@g.us');

    if (isGroup || !chatbotEnabled.get(user)) return;
    if (body.startsWith('.')) return;

    const now = Date.now();
    const lastReply = lastReplyTime.get(user) || 0;
    if (now - lastReply < REPLY_INTERVAL) return;

    const aiResponse = await getAIResponse(user, body);
    if (aiResponse) {
        await conn.sendMessage(from, { text: aiResponse }, { quoted: mek });
        lastReplyTime.set(user, now);
    }
}

module.exports.handleChatbotMessage = handleChatbotMessage;
