const { cmd } = require("../command");
const fetch = require("node-fetch");
const axios = require("axios");

cmd({
    pattern: "tiny",
    alias: ['short', 'shorturl'],
    react: "🫧",
    desc: "Makes URL tiny.",
    category: "convert",
    use: "<url>",
    filename: __filename,
}, async (conn, mek, m, { from, reply, q }) => {
    if (!q) {
        return reply("*🏷️ ᴘʟᴇᴀsᴇ ᴘʀᴏᴠɪᴅᴇ ᴀ ʟɪɴᴋ.*\n\nExample: .tiny https://example.com");
    }

    try {
        let link = q.toString();
        if (!/^https?:\/\//i.test(link)) link = `http://${link}`;
        const encoded = encodeURIComponent(link);
        const response = await axios.get(`https://tinyurl.com/api-create.php?url=${encoded}`);
        const shortenedUrl = response.data;

        if (!shortenedUrl || typeof shortenedUrl !== 'string') {
            return reply("Failed to shorten the provided URL. Try again later.");
        }

        // Send message with copy button
        const button = [
            {
                buttonId: 'id1',
                buttonText: { displayText: '📋 Copy URL' },
                type: 1
            },
            {
                buttonId: 'id2',
                buttonText: { displayText: '🔗 Visit' },
                type: 1
            }
        ];

        const message = {
            text: `*🛡️ YOUR SHORTENED URL*\n\n🔗 Original: ${link}\n\n✂️ Shortened: ${shortenedUrl}\n\nTap a button to copy or visit!`,
            footer: '✨ TEKNOVA MD URL Shortener',
            buttons: button,
            headerType: 1
        };

        try {
            await conn.sendMessage(from, message, { quoted: mek });
        } catch (btnErr) {
            // Fallback if buttons not supported
            return reply(`*🛡️ YOUR SHORTENED URL*\n\n${shortenedUrl}\n\n_Tap to copy or share_`);
        }
    } catch (e) {
        console.error("Error shortening URL:", e);
        return reply("An error occurred while shortening the URL. Please try again.");
    }
});
