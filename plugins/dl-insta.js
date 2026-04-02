const axios = require("axios");
const { cmd } = require('../command');

// Utility: Try multiple APIs with fallback
async function tryMultipleAPIs(apis) {
    for (const api of apis) {
        try {
            const response = await axios.get(api.url, { timeout: api.timeout || 30000 });
            if (api.validate(response.data)) {
                return { success: true, data: response.data, type: api.type };
            }
        } catch (err) {
            console.error(`API ${api.type} failed:`, err.message);
            continue;
        }
    }
    return { success: false };
}

// Instagram Video/Reel Download v1
cmd({
    pattern: "igdl",
    alias: ["instagram", "insta", "ig", "igvideo"],
    react: "⬇️",
    desc: "Download Instagram videos/reels",
    category: "downloader",
    use: ".igdl <Instagram URL>",
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        const url = q || m.quoted?.text;
        if (!url || !url.includes("instagram.com")) {
            return reply("❌ Please provide/reply to an Instagram link\n\nExample: .igdl https://instagram.com/reel/...");
        }

        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        const downloadAPIs = [
            {
                type: 'aswin-sparky',
                url: `https://api-aswin-sparky.koyeb.app/api/downloader/igdl?url=${encodeURIComponent(url)}`,
                timeout: 20000,
                validate: (data) => data?.status && data?.data && Array.isArray(data.data) && data.data.length > 0
            },
            {
                type: 'bk9',
                url: `https://bk9.fun/download/instagram?url=${encodeURIComponent(url)}`,
                timeout: 20000,
                validate: (data) => data?.status && data?.BK9 && Array.isArray(data.BK9) && data.BK9.length > 0
            },
            {
                type: 'rest-lily',
                url: `https://rest-lily.vercel.app/api/download/ig?url=${encodeURIComponent(url)}`,
                timeout: 20000,
                validate: (data) => data?.status && data?.result && Array.isArray(data.result)
            }
        ];

        const result = await tryMultipleAPIs(downloadAPIs);
        if (!result.success) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply("❌ Failed to download. Link may be private, expired, or account restricted.");
        }

        // Extract media items based on API type
        let mediaItems = [];
        if (result.type === 'aswin-sparky') {
            mediaItems = result.data.data;
        } else if (result.type === 'bk9') {
            mediaItems = result.data.BK9.map(item => ({
                type: item.type,
                url: item.url
            }));
        } else {
            mediaItems = result.data.result;
        }

        // Send media (limit to 5 items to avoid spam)
        const itemsToSend = mediaItems.slice(0, 5);
        let sentCount = 0;

        for (const item of itemsToSend) {
            try {
                await conn.sendMessage(from, {
                    [item.type === 'video' ? 'video' : 'image']: { url: item.url },
                    caption: `📶 *Instagram Download*\n\n✅ ${++sentCount}/${itemsToSend.length} items downloaded`
                }, { quoted: mek });
                await new Promise(r => setTimeout(r, 1000)); // Delay between sends
            } catch (itemError) {
                console.error('Error sending media item:', itemError);
            }
        }

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (error) {
        console.error('IGDL Error:', error);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        reply(`❌ Error: ${error.message}`);
    }
});

// Instagram Video Download v2 (Alternative)
cmd({
    pattern: "igdl2",
    alias: ["instagram2", "ig2", "instadl", "igvideo2"],
    react: '📥',
    desc: "Download Instagram videos (Alternative API)",
    category: "download",
    use: ".igdl2 <Instagram URL>",
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        const igUrl = q || m.quoted?.text;
        if (!igUrl || !igUrl.includes("instagram.com")) {
            return reply('❌ Please provide a valid Instagram video URL.\n\nExample:\n.igdl2 https://instagram.com/reel/...');
        }

        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        const downloadAPIs = [
            {
                type: 'jawad',
                url: `https://jawad-tech.vercel.app/downloader?url=${encodeURIComponent(igUrl)}`,
                timeout: 20000,
                validate: (data) => data?.status && data?.result && Array.isArray(data.result) && data.result.length > 0
            },
            {
                type: 'rest-lily',
                url: `https://rest-lily.vercel.app/api/download/ig?url=${encodeURIComponent(igUrl)}`,
                timeout: 20000,
                validate: (data) => data?.status && data?.result && Array.isArray(data.result)
            }
        ];

        const result = await tryMultipleAPIs(downloadAPIs);
        if (!result.success) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply('❌ Download failed. Try .igdl command instead.');
        }

        const videoUrl = result.data.result[0];
        const metadata = result.data.metadata || {};
        const author = metadata.author || "Unknown";
        const caption = metadata.caption ? metadata.caption.slice(0, 300) : "No caption provided";
        const likes = metadata.like || "N/A";
        const comments = metadata.comment || "N/A";

        await conn.sendMessage(from, {
            video: { url: videoUrl },
            caption: `📥 *Instagram Reel Downloader*\n👤 *Author:* ${author}\n💬 *Caption:* ${caption}\n❤️ *Likes:* ${likes} | 💭 *Comments:* ${comments}\n\n✅ Download Complete`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
    } catch (error) {
        console.error('IGDL2 Error:', error);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        reply(`❌ Error: ${error.message}`);
    }
});

// Instagram Video Download v3 (Backup)
cmd({
    pattern: "ig3",
    alias: ["insta3", "instagram3", "ig3dl"],
    desc: "Download Instagram video (Backup API)",
    category: "downloader",
    react: "⤵️",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide an Instagram video link.\n\nExample: .ig3 https://instagram.com/reel/...");
        if (!q.includes("instagram.com")) return reply("❌ Invalid Instagram link.");

        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
        reply("⬇️ *Downloading video...* Please wait");

        const downloadAPIs = [
            {
                type: 'rest-lily',
                url: `https://rest-lily.vercel.app/api/download/iga?url=${encodeURIComponent(q)}`,
                timeout: 20000,
                validate: (data) => data?.status && data?.data && data.data[0]
            }
        ];

        const result = await tryMultipleAPIs(downloadAPIs);
        if (!result.success) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply("❌ Failed to fetch Instagram video. Try .igdl instead.");
        }

        const { url } = result.data.data[0];

        const caption = `📶 *Instagram Downloader*\n\n- ❤️ *Quality*: HD\n\n✅ Download Complete`;

        await conn.sendMessage(from, {
            video: { url: url },
            caption: caption
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("IG3 Error:", e);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        reply(`❌ Error: ${e.message}`);
    }
});
