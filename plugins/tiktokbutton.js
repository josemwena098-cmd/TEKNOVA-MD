const axios = require("axios");
const { cmd } = require("../command");

cmd({
    pattern: "tiktok2",
    alias: ["tt", "ttdl", "tiktokdl"],
    desc: "Download TikTok video or audio",
    category: "download",
    react: "🎵",
    filename: __filename
},
    async (conn, mek, m, { from, q, reply }) => {
        try {
            if (!q) return reply("📝 Please provide a TikTok video URL.");
            const urlText = (typeof q === 'string') ? q.trim() : (q && q.url) ? q.url : '';
            // Accept tiktok.com with optional subdomains (vm., vt., m., www., etc.) and short links
            if (!/^(https?:\/\/)?(?:[a-z0-9-]+\.)?tiktok\.com\/.+/i.test(urlText) && !/^(https?:\/\/)?vt\.tiktok\.com\/.+/i.test(urlText)) return reply("❌ Invalid TikTok link.");

            reply("⏳ Fetching TikTok video, please wait...");

            // Multiple API fallbacks for TikTok download
            const apis = [
                { url: `https://api.davidcyriltech.my.id/download/tiktok?url=${encodeURIComponent(urlText)}` },
                { url: `https://api.vihangayt.com/download?url=${encodeURIComponent(urlText)}&type=video` },
                { url: `https://yt-api.p.rapidapi.com/dl?url=${encodeURIComponent(urlText)}`, headers: { 'X-RapidAPI-Key': 'demo', 'X-RapidAPI-Host': 'yt-api.p.rapidapi.com' } },
                { url: `https://api.siputzx.my.id/api/d/tiktok?url=${encodeURIComponent(urlText)}` }
            ];

            let title = 'TikTok Video';
            let videoUrl = null;
            let author = { nickname: 'Unknown', username: 'unknown' };
            let meta = { likes: 0, comments: 0, shares: 0 };

            for (const apiConfig of apis) {
                try {
                    const { data } = await axios.get(apiConfig.url, {
                        timeout: 30000,
                        headers: apiConfig.headers || {}
                    });

                    // Try to extract from different response formats
                    if (data) {
                        // Format 1: davidcyriltech
                        if (data.data?.video) {
                            videoUrl = data.data.video;
                            title = data.data.title || 'TikTok Video';
                            author = { nickname: data.data.author || 'Unknown', username: data.data.author || 'unknown' };
                            break;
                        }
                        // Format 2: vihangayt
                        if (data.result?.video || data.url) {
                            videoUrl = data.result?.video || data.url;
                            title = data.title || 'TikTok Video';
                            break;
                        }
                        // Format 3: rapidapi / generic
                        if (data.data?.url || data.url || data.result?.download) {
                            videoUrl = data.data?.url || data.url || data.result?.download;
                            title = data.title || data.data?.title || 'TikTok Video';
                            break;
                        }
                        // Format 4: siputzx
                        if (data.data?.url) {
                            videoUrl = data.data.url;
                            title = data.data.title || 'TikTok Video';
                            break;
                        }
                    }
                } catch (err) {
                    console.warn(`TikTok API failed: ${apiConfig.url} -`, err.message);
                    continue;
                }
            }

            if (!videoUrl) {
                return reply("⚠️ Couldn't retrieve the video. Please try another link or ensure it's publicly available.");
            }

            // Prepare list
            const sections = [
                {
                    title: "📥 Download Options",
                    rows: [
                        {
                            title: "▶️ Send as Video",
                            description: "Send TikTok video as streamable",
                            rowId: `.ttvideo ${videoUrl}`
                        },
                        {
                            title: "🗂️ Send as Document",
                            description: "Send TikTok video as file/document",
                            rowId: `.ttdoc ${videoUrl}`
                        },
                        {
                            title: "🎧 Send as Audio",
                            description: "Extract and send audio",
                            rowId: `.ttaudio ${videoUrl}`
                        }
                    ]
                }
            ];

            const listMessage = {
                text: `🎵 TikTok video found!

👤 User: ${author.nickname} (@${author.username})
📖 Title: ${title}
👍 Likes: ${meta.likes} | 💬 Comments: ${meta.comments} | 🔁 Shares: ${meta.shares}

Select how you'd like to download below:`,
                footer: "TEKNOVA MD TikTok Downloader",
                buttonText: "📁 Select Format",
                sections
            };

            await conn.sendMessage(from, listMessage, { quoted: mek });

        } catch (e) {
            console.error("List menu TikTok error:", e);
            reply(`❌ Error occurred: ${e.message}`);
        }
    });
