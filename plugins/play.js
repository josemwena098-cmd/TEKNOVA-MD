const config = require('../config');
const { cmd } = require('../command');
const { ytsearch } = require('@dark-yasiya/yt-dl.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Cinemind API configuration
const CINEMIND_API = {
    BASE: 'https://api.cinemind.name.ng',
    // YouTube endpoints
    YT_SEARCH: '/api/yt/search',
    DOWNLOAD_AUDIO: '/download-audio',
    DOWNLOAD_VIDEO: '/download-video',
    DOWNLOAD_TIKTOK: '/download-tiktok',
    DOWNLOAD_FB: '/download-fb',
    DOWNLOAD_IG: '/download-ig'
};

// Helper function to extract YouTube video ID
function extractVideoId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&?\/\s]{11})/i,
        /youtube\.com\/shorts\/([^&?\/\s]{11})/i
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

// Enhanced play command with Cinemind API
cmd({
    pattern: "play",
    alias: ["song", "audio", "mp3", "ytmp3", "yta"],
    react: "🎵",
    desc: "Download YouTube audio with Cinemind API",
    category: "download",
    use: '.play <song name or YouTube URL>',
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        let input = q || (m.quoted && m.quoted.text?.trim());
        if (!input) return reply("❌ *Please enter a song name or YouTube link!*");

        await reply("🔍 *Searching YouTube...*");

        let videoUrl, videoTitle, videoThumbnail, videoId, duration, views, author;

        // Check if input is a YouTube URL
        if (input.match(/(youtube\.com|youtu\.be)/i)) {
            videoUrl = input.trim();
            videoId = extractVideoId(videoUrl);
            if (!videoId) return reply("❌ *Invalid YouTube URL!*");
            
            // Try to get video info from Cinemind search
            try {
                const infoResponse = await axios.get(`${CINEMIND_API.BASE}${CINEMIND_API.YT_SEARCH}`, {
                    params: { q: videoUrl },
                    timeout: 10000
                });
                if (infoResponse.data?.status && infoResponse.data?.data?.[0]) {
                    const info = infoResponse.data.data[0];
                    videoTitle = info.title;
                    videoThumbnail = info.thumbnail;
                    duration = info.duration;
                    views = info.views;
                    author = info.channel;
                } else {
                    videoTitle = "YouTube Audio";
                    videoThumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
                    duration = "Unknown";
                    views = "Unknown";
                    author = "Unknown";
                }
            } catch (err) {
                videoTitle = "YouTube Audio";
                videoThumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
                duration = "Unknown";
                views = "Unknown";
                author = "Unknown";
            }
        } else {
            // Search using Cinemind API first
            try {
                const searchResponse = await axios.get(`${CINEMIND_API.BASE}${CINEMIND_API.YT_SEARCH}`, {
                    params: { q: input },
                    timeout: 15000
                });

                if (searchResponse.data?.status && searchResponse.data?.data?.length > 0) {
                    const vid = searchResponse.data.data[0];
                    videoUrl = vid.url;
                    videoTitle = vid.title;
                    videoThumbnail = vid.thumbnail;
                    videoId = extractVideoId(videoUrl);
                    duration = vid.duration;
                    views = vid.views;
                    author = vid.channel;
                } else {
                    // Fallback to ytsearch
                    const search = await ytsearch(input);
                    const vid = search?.results?.[0];
                    if (!vid || !vid.url) return reply("❌ *No results found!*");
                    
                    videoUrl = vid.url;
                    videoTitle = vid.title;
                    videoThumbnail = vid.thumbnail;
                    videoId = extractVideoId(videoUrl);
                    duration = vid.timestamp || "Unknown";
                    views = vid.views || "Unknown";
                    author = vid.author?.name || "Unknown";
                }
            } catch (searchError) {
                // Fallback to ytsearch
                const search = await ytsearch(input);
                const vid = search?.results?.[0];
                if (!vid || !vid.url) return reply("❌ *No results found!*");
                
                videoUrl = vid.url;
                videoTitle = vid.title;
                videoThumbnail = vid.thumbnail;
                videoId = extractVideoId(videoUrl);
                duration = vid.timestamp || "Unknown";
                views = vid.views || "Unknown";
                author = vid.author?.name || "Unknown";
            }
        }

        const cleanTitle = videoTitle.replace(/[^\w\s.-]/gi, "").slice(0, 50);

        // Send video info
        await conn.sendMessage(from, {
            image: { url: videoThumbnail },
            caption: `
╭───〘 🎵 𝚈𝙾𝚄𝚃𝚄𝙱𝙴 𝙰𝚄𝙳𝙸𝙾 〙───◆
│ 📝 *ᴛɪᴛʟᴇ:* ${videoTitle}
│ ⏱️ *ᴅᴜʀᴀᴛɪᴏɴ:* ${duration}
│ 👁️ *ᴠɪᴇᴡs:* ${views}
│ 👤 *ᴀᴜᴛʜᴏʀ:* ${author}
│ 🔗 *ᴜʀʟ:* ${videoUrl}
╰───────────────◆
🎧 *Downloading audio...*
            `.trim()
        }, { quoted: mek });

        // Create temp directory if it doesn't exist
        const tempDir = path.join(__dirname, '..', 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // Multiple API endpoints with Cinemind as primary
        const apis = [
            {
                name: 'Cinemind',
                url: `${CINEMIND_API.BASE}${CINEMIND_API.DOWNLOAD_AUDIO}`,
                params: { url: videoUrl },
                method: 'GET',
                parseUrl: (data) => data?.downloadUrl || data?.result || data?.url,
                isJson: true
            },
            {
                name: 'Cobalt',
                url: `https://api.cobalt.tools/api/json`,
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: { url: videoUrl, vQuality: '128', aFormat: 'mp3' },
                method: 'POST',
                parseUrl: (data) => data?.url || data?.links?.download?.url,
                isJson: true
            },
            {
                name: 'Vihanga',
                url: `https://api.vihangayt.com/download`,
                params: { url: videoUrl, type: 'audio' },
                method: 'GET',
                parseUrl: (data) => data?.url || data?.data?.url || data?.result,
                isJson: true
            }
        ];

        let success = false;

        for (const apiConfig of apis) {
            try {
                console.log(`🎵 Trying ${apiConfig.name} API...`);

                let response;
                if (apiConfig.method === 'POST') {
                    response = await axios.post(apiConfig.url, apiConfig.body, {
                        headers: apiConfig.headers || { 'User-Agent': 'Mozilla/5.0' },
                        timeout: 30000
                    });
                } else {
                    response = await axios.get(apiConfig.url, {
                        params: apiConfig.params,
                        headers: apiConfig.headers || { 'User-Agent': 'Mozilla/5.0' },
                        timeout: 30000
                    });
                }

                // Extract audio URL
                let audioUrl = apiConfig.parseUrl(response.data);
                
                if (!audioUrl) {
                    console.warn(`⚠️ No audio URL found in ${apiConfig.name} response`);
                    continue;
                }

                console.log(`✅ Got audio URL from ${apiConfig.name}`);

                // Download the audio file
                const audioRes = await axios({
                    url: audioUrl,
                    method: "GET",
                    responseType: "arraybuffer",
                    timeout: 60000,
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });

                if (!audioRes.data || audioRes.data.length === 0) {
                    console.warn(`⚠️ No audio data from ${apiConfig.name}`);
                    continue;
                }

                console.log(`📥 Downloaded ${(audioRes.data.length / 1024 / 1024).toFixed(2)} MB from ${apiConfig.name}`);

                // Send audio file
                await conn.sendMessage(from, {
                    audio: audioRes.data,
                    mimetype: 'audio/mpeg',
                    fileName: `${cleanTitle}.mp3`,
                    ptt: false
                }, { quoted: mek });

                // Send success reaction
                await conn.sendMessage(from, {
                    react: { text: "✅", key: mek.key }
                });

                success = true;
                break;

            } catch (err) {
                console.warn(`⚠️ ${apiConfig.name} API failed:`, err.message);
                continue;
            }
        }

        if (!success) {
            await conn.sendMessage(from, {
                react: { text: "❌", key: mek.key }
            });
            reply("🚫 *All download servers failed. Please try again later.*\nℹ️ Try using .playx for legacy support.");
        }

    } catch (e) {
        console.error("❌ Error in .play command:", e);
        await conn.sendMessage(from, {
            react: { text: "❌", key: mek.key }
        });
        reply("🚨 *Something went wrong!*\n" + e.message);
    }
});

// Enhanced video command with Cinemind API
cmd({
    pattern: "video",
    alias: ["mp4", "ytmp4", "ytv"],
    react: "🎬",
    desc: "Download YouTube video with Cinemind API",
    category: "download",
    use: '.video <video name or YouTube URL>',
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        let input = q || (m.quoted && m.quoted.text?.trim());
        if (!input) return reply("❌ *Please enter a video name or YouTube link!*");

        await reply("🔍 *Searching YouTube...*");

        let videoUrl, videoTitle, videoThumbnail, videoId, duration, views, author;

        // Check if input is a YouTube URL
        if (input.match(/(youtube\.com|youtu\.be)/i)) {
            videoUrl = input.trim();
            videoId = extractVideoId(videoUrl);
            if (!videoId) return reply("❌ *Invalid YouTube URL!*");
            
            // Try to get video info
            try {
                const infoResponse = await axios.get(`${CINEMIND_API.BASE}${CINEMIND_API.YT_SEARCH}`, {
                    params: { q: videoUrl },
                    timeout: 10000
                });
                if (infoResponse.data?.status && infoResponse.data?.data?.[0]) {
                    const info = infoResponse.data.data[0];
                    videoTitle = info.title;
                    videoThumbnail = info.thumbnail;
                    duration = info.duration;
                    views = info.views;
                    author = info.channel;
                } else {
                    videoTitle = "YouTube Video";
                    videoThumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
                    duration = "Unknown";
                    views = "Unknown";
                    author = "Unknown";
                }
            } catch (err) {
                videoTitle = "YouTube Video";
                videoThumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
                duration = "Unknown";
                views = "Unknown";
                author = "Unknown";
            }
        } else {
            // Search using Cinemind API first
            try {
                const searchResponse = await axios.get(`${CINEMIND_API.BASE}${CINEMIND_API.YT_SEARCH}`, {
                    params: { q: input },
                    timeout: 15000
                });

                if (searchResponse.data?.status && searchResponse.data?.data?.length > 0) {
                    const vid = searchResponse.data.data[0];
                    videoUrl = vid.url;
                    videoTitle = vid.title;
                    videoThumbnail = vid.thumbnail;
                    videoId = extractVideoId(videoUrl);
                    duration = vid.duration;
                    views = vid.views;
                    author = vid.channel;
                } else {
                    // Fallback to ytsearch
                    const search = await ytsearch(input);
                    const vid = search?.results?.[0];
                    if (!vid || !vid.url) return reply("❌ *No results found!*");
                    
                    videoUrl = vid.url;
                    videoTitle = vid.title;
                    videoThumbnail = vid.thumbnail;
                    videoId = extractVideoId(videoUrl);
                    duration = vid.timestamp || "Unknown";
                    views = vid.views || "Unknown";
                    author = vid.author?.name || "Unknown";
                }
            } catch (searchError) {
                // Fallback to ytsearch
                const search = await ytsearch(input);
                const vid = search?.results?.[0];
                if (!vid || !vid.url) return reply("❌ *No results found!*");
                
                videoUrl = vid.url;
                videoTitle = vid.title;
                videoThumbnail = vid.thumbnail;
                videoId = extractVideoId(videoUrl);
                duration = vid.timestamp || "Unknown";
                views = vid.views || "Unknown";
                author = vid.author?.name || "Unknown";
            }
        }

        const cleanTitle = videoTitle.replace(/[^\w\s.-]/gi, "").slice(0, 50);

        // Send video info
        await conn.sendMessage(from, {
            image: { url: videoThumbnail },
            caption: `
╭───〘 🎬 𝚈𝙾𝚄𝚃𝚄𝙱𝙴 𝚅𝙸𝙳𝙴𝙾 〙───◆
│ 📝 *ᴛɪᴛʟᴇ:* ${videoTitle}
│ ⏱️ *ᴅᴜʀᴀᴛɪᴏɴ:* ${duration}
│ 👁️ *ᴠɪᴇᴡs:* ${views}
│ 👤 *ᴀᴜᴛʜᴏʀ:* ${author}
│ 🔗 *ᴜʀʟ:* ${videoUrl}
╰───────────────◆
🎬 *Downloading video...*
            `.trim()
        }, { quoted: mek });

        // Video download APIs with Cinemind as primary
        const videoApis = [
            {
                name: 'Cinemind',
                url: `${CINEMIND_API.BASE}${CINEMIND_API.DOWNLOAD_VIDEO}`,
                params: { url: videoUrl },
                method: 'GET',
                parseUrl: (data) => data?.downloadUrl || data?.result || data?.url
            },
            {
                name: 'Cobalt',
                url: `https://api.cobalt.tools/api/json`,
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: { url: videoUrl, vQuality: '720', aFormat: 'mp4' },
                method: 'POST',
                parseUrl: (data) => data?.url || data?.links?.download?.url
            },
            {
                name: 'Vihanga',
                url: `https://api.vihangayt.com/download`,
                params: { url: videoUrl, type: 'video' },
                method: 'GET',
                parseUrl: (data) => data?.url || data?.data?.url || data?.result
            }
        ];

        let success = false;

        for (const apiConfig of videoApis) {
            try {
                console.log(`🎬 Trying ${apiConfig.name} API...`);

                let response;
                if (apiConfig.method === 'POST') {
                    response = await axios.post(apiConfig.url, apiConfig.body, {
                        headers: apiConfig.headers || { 'User-Agent': 'Mozilla/5.0' },
                        timeout: 30000
                    });
                } else {
                    response = await axios.get(apiConfig.url, {
                        params: apiConfig.params,
                        headers: apiConfig.headers || { 'User-Agent': 'Mozilla/5.0' },
                        timeout: 30000
                    });
                }

                let downloadUrl = apiConfig.parseUrl(response.data);
                
                if (!downloadUrl) {
                    console.warn(`⚠️ No video URL found in ${apiConfig.name} response`);
                    continue;
                }

                console.log(`✅ Got video URL from ${apiConfig.name}`);

                await conn.sendMessage(from, {
                    video: { url: downloadUrl },
                    caption: `🎬 *${videoTitle}*`,
                    fileName: `${cleanTitle}.mp4`,
                    mimetype: 'video/mp4'
                }, { quoted: mek });

                await conn.sendMessage(from, {
                    react: { text: "✅", key: mek.key }
                });
                
                success = true;
                break;

            } catch (err) {
                console.warn(`⚠️ ${apiConfig.name} API failed:`, err.message);
                continue;
            }
        }

        if (!success) {
            await conn.sendMessage(from, {
                react: { text: "❌", key: mek.key }
            });
            reply("🚫 *All video download servers failed. Please try again later.*");
        }

    } catch (e) {
        console.error("❌ Error in .video command:", e);
        await conn.sendMessage(from, {
            react: { text: "❌", key: mek.key }
        });
        reply("🚨 *Something went wrong while downloading video!*");
    }
});

// TikTok downloader with Cinemind API
cmd({
    pattern: "tiktok",
    alias: ["tt", "ttdl", "tiktokdl"],
    react: "📱",
    desc: "Download TikTok video with Cinemind API",
    category: "download",
    use: '.tiktok <TikTok URL>',
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        let url = q || (m.quoted && m.quoted.text?.trim());
        if (!url) return reply("❌ *Please provide a TikTok URL!*\nExample: .tiktok https://www.tiktok.com/@user/video/123456789");
        
        if (!url.includes('tiktok.com')) {
            return reply("❌ *Please provide a valid TikTok URL!*");
        }

        await reply("📱 *Downloading TikTok video...*");

        try {
            const response = await axios.get(`${CINEMIND_API.BASE}${CINEMIND_API.DOWNLOAD_TIKTOK}`, {
                params: { url: url },
                timeout: 30000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });

            if (response.data && (response.data.downloadUrl || response.data.result)) {
                const downloadUrl = response.data.downloadUrl || response.data.result;
                
                await conn.sendMessage(from, {
                    video: { url: downloadUrl },
                    mimetype: "video/mp4",
                    caption: "📱 *TikTok Video*\nDownloaded with Cinemind API",
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true
                    }
                }, { quoted: mek });
                
                await conn.sendMessage(from, {
                    react: { text: "✅", key: mek.key }
                });
            } else {
                return reply("❌ *Failed to download TikTok video.*\nPlease check the URL and try again.");
            }
        } catch (error) {
            console.error('TikTok download error:', error);
            return reply(`❌ *Download failed:* ${error.message}`);
        }
    } catch (error) {
        console.error('TikTok error:', error);
        reply(`❌ *Error:* ${error.message}`);
    }
});

// Facebook downloader with Cinemind API
cmd({
    pattern: "fb",
    alias: ["facebook", "fbdl", "facebookdl"],
    react: "📘",
    desc: "Download Facebook video with Cinemind API",
    category: "download",
    use: '.fb <Facebook Video URL>',
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        let url = q || (m.quoted && m.quoted.text?.trim());
        if (!url) return reply("❌ *Please provide a Facebook video URL!*\nExample: .fb https://www.facebook.com/watch?v=123456789");
        
        if (!url.includes('facebook.com') && !url.includes('fb.watch')) {
            return reply("❌ *Please provide a valid Facebook video URL!*");
        }

        await reply("📘 *Downloading Facebook video...*");

        try {
            const response = await axios.get(`${CINEMIND_API.BASE}${CINEMIND_API.DOWNLOAD_FB}`, {
                params: { url: url },
                timeout: 30000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });

            if (response.data && (response.data.downloadUrl || response.data.result)) {
                const downloadUrl = response.data.downloadUrl || response.data.result;
                
                await conn.sendMessage(from, {
                    video: { url: downloadUrl },
                    mimetype: "video/mp4",
                    caption: "📘 *Facebook Video*\nDownloaded with Cinemind API",
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true
                    }
                }, { quoted: mek });
                
                await conn.sendMessage(from, {
                    react: { text: "✅", key: mek.key }
                });
            } else {
                return reply("❌ *Failed to download Facebook video.*\nPlease check the URL and try again.");
            }
        } catch (error) {
            console.error('Facebook download error:', error);
            return reply(`❌ *Download failed:* ${error.message}`);
        }
    } catch (error) {
        console.error('Facebook error:', error);
        reply(`❌ *Error:* ${error.message}`);
    }
});

// Instagram downloader with Cinemind API
cmd({
    pattern: "ig",
    alias: ["instagram", "igdl", "insta", "reel"],
    react: "📸",
    desc: "Download Instagram Reel/Video/Image with Cinemind API",
    category: "download",
    use: '.ig <Instagram URL>',
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        let url = q || (m.quoted && m.quoted.text?.trim());
        if (!url) return reply("❌ *Please provide an Instagram URL!*\nExample: .ig https://www.instagram.com/reel/xyz123");
        
        if (!url.includes('instagram.com')) {
            return reply("❌ *Please provide a valid Instagram URL!*");
        }

        await reply("📸 *Downloading Instagram media...*");

        try {
            const response = await axios.get(`${CINEMIND_API.BASE}${CINEMIND_API.DOWNLOAD_IG}`, {
                params: { url: url },
                timeout: 30000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });

            if (response.data && response.data.data) {
                const media = response.data.data;
                
                if (media.type === 'video' && media.url) {
                    await conn.sendMessage(from, {
                        video: { url: media.url },
                        mimetype: "video/mp4",
                        caption: "📸 *Instagram Video*\nDownloaded with Cinemind API",
                        contextInfo: {
                            forwardingScore: 999,
                            isForwarded: true
                        }
                    }, { quoted: mek });
                } else if (media.type === 'image' && media.url) {
                    await conn.sendMessage(from, {
                        image: { url: media.url },
                        caption: "📸 *Instagram Image*\nDownloaded with Cinemind API",
                        contextInfo: {
                            forwardingScore: 999,
                            isForwarded: true
                        }
                    }, { quoted: mek });
                } else if (Array.isArray(media) && media.length > 0) {
                    // Handle multiple media (carousel)
                    for (const item of media) {
                        if (item.type === 'video') {
                            await conn.sendMessage(from, {
                                video: { url: item.url },
                                mimetype: "video/mp4"
                            }, { quoted: mek });
                        } else if (item.type === 'image') {
                            await conn.sendMessage(from, {
                                image: { url: item.url }
                            }, { quoted: mek });
                        }
                    }
                } else {
                    return reply("❌ *Failed to download Instagram media.*\nUnsupported media format.");
                }
                
                await conn.sendMessage(from, {
                    react: { text: "✅", key: mek.key }
                });
            } else {
                return reply("❌ *Failed to download Instagram media.*\nPlease check the URL and try again.");
            }
        } catch (error) {
            console.error('Instagram download error:', error);
            return reply(`❌ *Download failed:* ${error.message}`);
        }
    } catch (error) {
        console.error('Instagram error:', error);
        reply(`❌ *Error:* ${error.message}`);
    }
});

// Keep your existing commands (playx, videox, oldplay) as fallbacks
// ... (your existing code for playx, videox, oldplay remains here)
