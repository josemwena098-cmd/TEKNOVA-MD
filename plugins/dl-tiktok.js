const axios = require("axios");
const { cmd } = require("../command");

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

// TikTok Download v1
cmd({
    pattern: "tiktok",
    alias: ["ttdl", "tt", "tiktokdl"],
    desc: "Download TikTok video without watermark",
    category: "downloader",
    react: "🎵",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a TikTok video link.\n\nExample: .tiktok https://vt.tiktok.com/...");
        if (!q.includes("tiktok.com") && !q.includes("vt.tiktok")) return reply("❌ Invalid TikTok link.");
        
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
        reply("⬇️ *Downloading TikTok video...* Please wait");
        
        const downloadAPIs = [
            {
                type: 'api1',
                url: `https://delirius-apiofc.vercel.app/download/tiktok?url=${encodeURIComponent(q)}`,
                timeout: 20000,
                validate: (data) => data?.status && data?.data?.meta?.media
            },
            {
                type: 'api2',
                url: `https://bk9.fun/download/tiktok2?url=${encodeURIComponent(q)}`,
                timeout: 20000,
                validate: (data) => data?.status && data?.BK9?.video?.noWatermark
            }
        ];

        const result = await tryMultipleAPIs(downloadAPIs);
        if (!result.success) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply("❌ Failed to download TikTok video. Link may be expired or private.");
        }

        let videoUrl, caption;

        if (result.type === 'api1') {
            const { title, like, comment, share, author } = result.data.data;
            videoUrl = result.data.data.meta.media.find(v => v.type === "video").org;
            caption = `🎵 *TikTok Video*\n\n👤 *User:* ${author.nickname}\n📖 *Caption:* ${title}\n👍 *Likes:* ${like}\n💬 *Comments:* ${comment}\n🔁 *Shares:* ${share}`;
        } else {
            videoUrl = result.data.BK9.video.noWatermark;
            caption = `🎵 *TikTok Video Download*\n\n✅ Downloaded without watermark`;
        }
        
        await conn.sendMessage(from, {
            video: { url: videoUrl },
            caption: caption
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
        
    } catch (e) {
        console.error("TikTok Error:", e);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        reply(`❌ Error: ${e.message}`);
    }
});

// TikTok Download v2 (Alternative)
cmd({
    pattern: "tt2",
    alias: ["ttdl2", "ttv2", "tiktok2"],
    desc: "Download TikTok video (Alternative API)",
    category: "downloader",
    react: "⬇️",
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        const url = q || m.quoted?.text;
        if (!url || (!url.includes("tiktok.com") && !url.includes("vt.tiktok"))) {
            return reply("❌ Please provide/reply to a valid TikTok link");
        }

        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        const downloadAPIs = [
            {
                type: 'bk9',
                url: `https://bk9.fun/download/tiktok2?url=${encodeURIComponent(url)}`,
                timeout: 20000,
                validate: (data) => data?.status && data?.BK9?.video?.noWatermark
            },
            {
                type: 'jawad',
                url: `https://jawad-tech.vercel.app/download/tiktok?url=${encodeURIComponent(url)}`,
                timeout: 20000,
                validate: (data) => data?.status && data?.result && data.result.length > 0
            }
        ];

        const result = await tryMultipleAPIs(downloadAPIs);
        if (!result.success) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply("❌ Download failed. Try .tiktok command instead.");
        }

        let videoUrl;
        if (result.type === 'bk9') {
            videoUrl = result.data.BK9.video.noWatermark;
        } else {
            videoUrl = result.data.result[0];
        }

        await conn.sendMessage(from, {
            video: { url: videoUrl },
            caption: `✅ *TikTok Downloaded*\n\n_No watermark applied_`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (error) {
        console.error('TT2 Error:', error);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        reply(`❌ Error: ${error.message}`);
    }
});

// TikTok Download v3 (Jawad API)
cmd({
    pattern: "tt3",
    alias: ["tiktok3", "ttdl3", "tt4"],
    react: "📥",
    desc: "Download TikTok video (Jawad API)",
    category: "download",
    use: ".tt3 <TikTok URL>",
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        const url = q || m.quoted?.text;
        if (!url || (!url.includes("tiktok.com") && !url.includes("vt.tiktok"))) {
            return reply("❌ Please provide a valid TikTok video URL.\n\nExample:\n.tt3 https://vt.tiktok.com/...");
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        const downloadAPIs = [
            {
                type: 'jawad',
                url: `https://jawad-tech.vercel.app/download/tiktok?url=${encodeURIComponent(url)}`,
                timeout: 20000,
                validate: (data) => data?.status && data?.result && Array.isArray(data.result) && data.result.length > 0
            }
        ];

        const result = await tryMultipleAPIs(downloadAPIs);
        if (!result.success) {
            await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
            return reply("❌ Video not found or unavailable. Try .tiktok instead.");
        }

        const videoUrl = result.data.result[0];
        const metadata = result.data.metadata || {};
        const author = metadata.author || "Unknown";
        const caption = metadata.caption ? metadata.caption.slice(0, 300) : "No caption";

        await conn.sendMessage(from, {
            video: { url: videoUrl },
            caption: `🎬 *TikTok Downloader*\n👤 *Author:* ${author}\n💬 *Caption:* ${caption}\n\n✅ Download Complete`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (err) {
        console.error("TT3 Error:", err);
        await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
        reply(`❌ Error: ${err.message}`);
    }
});
