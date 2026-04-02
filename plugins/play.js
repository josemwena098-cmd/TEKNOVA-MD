const config = require('../config');
const { cmd } = require('../command');
const { ytsearch } = require('@dark-yasiya/yt-dl.js');
const axios = require('axios');

// Cinemind API configuration
const CINEMIND_API = {
    BASE: 'https://api.cinemind.name.ng',
    YT_SEARCH: '/api/yt/search',
    DOWNLOAD_AUDIO: '/download-audio',
    DOWNLOAD_VIDEO: '/download-video'
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

// Helper function to format file name
function formatFileName(title) {
    return title.replace(/[^\w\s.-]/gi, "").replace(/\s+/g, '_').slice(0, 50);
}

// Main YouTube Audio Download Command
cmd({
    pattern: "play",
    alias: ["song", "audio", "mp3", "ytmp3", "yta"],
    react: "🎵",
    desc: "Download YouTube audio",
    category: "download",
    use: '.play <song name or YouTube URL>',
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        let input = q || (m.quoted && m.quoted.text?.trim());
        if (!input) return reply("❌ Please enter a song name or YouTube link!\n\nExample: .play Believer Imagine Dragons");

        await reply("🔍 Searching YouTube...");

        let videoUrl, videoTitle, videoThumbnail, videoId;

        // Check if input is a YouTube URL
        if (input.match(/(youtube\.com|youtu\.be)/i)) {
            videoUrl = input.trim();
            videoId = extractVideoId(videoUrl);
            if (!videoId) return reply("❌ Invalid YouTube URL!");
            videoTitle = "YouTube Audio";
            videoThumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
        } else {
            try {
                // Try Cinemind search first
                const searchResponse = await axios.get(`${CINEMIND_API.BASE}${CINEMIND_API.YT_SEARCH}`, {
                    params: { q: input },
                    timeout: 10000
                });

                if (searchResponse.data?.status && searchResponse.data?.data?.length > 0) {
                    const vid = searchResponse.data.data[0];
                    videoUrl = vid.url;
                    videoTitle = vid.title;
                    videoThumbnail = vid.thumbnail;
                    videoId = extractVideoId(videoUrl);
                } else {
                    throw new Error('No results from Cinemind');
                }
            } catch (searchError) {
                // Fallback to ytsearch
                const search = await ytsearch(input);
                const vid = search?.results?.[0];
                if (!vid || !vid.url) return reply("❌ No results found!");
                
                videoUrl = vid.url;
                videoTitle = vid.title;
                videoThumbnail = vid.thumbnail;
                videoId = extractVideoId(videoUrl);
            }
        }

        const cleanTitle = formatFileName(videoTitle);

        // Send video info
        await conn.sendMessage(from, {
            image: { url: videoThumbnail },
            caption: `🎵 *${videoTitle}*\n\n⬇️ Downloading audio...`
        }, { quoted: mek });

        // Try Cinemind audio download
        let audioUrl = null;
        
        try {
            const audioResponse = await axios.get(`${CINEMIND_API.BASE}${CINEMIND_API.DOWNLOAD_AUDIO}`, {
                params: { url: videoUrl },
                timeout: 30000
            });
            
            audioUrl = audioResponse.data?.downloadUrl || audioResponse.data?.result || audioResponse.data?.url;
        } catch (err) {
            console.log('Cinemind audio failed:', err.message);
        }

        // If Cinemind failed, try alternative API
        if (!audioUrl) {
            try {
                const altResponse = await axios.get(`https://api.cobalt.tools/api/json`, {
                    method: 'POST',
                    data: { url: videoUrl, vQuality: '128', aFormat: 'mp3' },
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 30000
                });
                audioUrl = altResponse.data?.url;
            } catch (err) {
                console.log('Cobalt audio failed:', err.message);
            }
        }

        if (!audioUrl) {
            return reply("❌ Failed to get audio download link. Please try again later.");
        }

        // Download and send audio
        const audioRes = await axios({
            url: audioUrl,
            method: "GET",
            responseType: "arraybuffer",
            timeout: 60000
        });

        if (!audioRes.data || audioRes.data.length === 0) {
            return reply("❌ Failed to download audio file.");
        }

        await conn.sendMessage(from, {
            audio: audioRes.data,
            mimetype: 'audio/mpeg',
            fileName: `${cleanTitle}.mp3`,
            ptt: false
        }, { quoted: mek });

        await conn.sendMessage(from, {
            react: { text: "✅", key: mek.key }
        });

    } catch (e) {
        console.error("Error in .play command:", e);
        await conn.sendMessage(from, {
            react: { text: "❌", key: mek.key }
        });
        reply("❌ Error: " + e.message);
    }
});

// YouTube Video Download Command
cmd({
    pattern: "video",
    alias: ["mp4", "ytmp4", "ytv"],
    react: "🎬",
    desc: "Download YouTube video",
    category: "download",
    use: '.video <video name or YouTube URL>',
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        let input = q || (m.quoted && m.quoted.text?.trim());
        if (!input) return reply("❌ Please enter a video name or YouTube link!\n\nExample: .video Baby Shark Dance");

        await reply("🔍 Searching YouTube...");

        let videoUrl, videoTitle, videoThumbnail, videoId;

        // Check if input is a YouTube URL
        if (input.match(/(youtube\.com|youtu\.be)/i)) {
            videoUrl = input.trim();
            videoId = extractVideoId(videoUrl);
            if (!videoId) return reply("❌ Invalid YouTube URL!");
            videoTitle = "YouTube Video";
            videoThumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
        } else {
            try {
                // Try Cinemind search first
                const searchResponse = await axios.get(`${CINEMIND_API.BASE}${CINEMIND_API.YT_SEARCH}`, {
                    params: { q: input },
                    timeout: 10000
                });

                if (searchResponse.data?.status && searchResponse.data?.data?.length > 0) {
                    const vid = searchResponse.data.data[0];
                    videoUrl = vid.url;
                    videoTitle = vid.title;
                    videoThumbnail = vid.thumbnail;
                    videoId = extractVideoId(videoUrl);
                } else {
                    throw new Error('No results from Cinemind');
                }
            } catch (searchError) {
                // Fallback to ytsearch
                const search = await ytsearch(input);
                const vid = search?.results?.[0];
                if (!vid || !vid.url) return reply("❌ No results found!");
                
                videoUrl = vid.url;
                videoTitle = vid.title;
                videoThumbnail = vid.thumbnail;
                videoId = extractVideoId(videoUrl);
            }
        }

        const cleanTitle = formatFileName(videoTitle);

        // Send video info
        await conn.sendMessage(from, {
            image: { url: videoThumbnail },
            caption: `🎬 *${videoTitle}*\n\n⬇️ Downloading video...`
        }, { quoted: mek });

        // Try Cinemind video download
        let videoDownloadUrl = null;
        
        try {
            const videoResponse = await axios.get(`${CINEMIND_API.BASE}${CINEMIND_API.DOWNLOAD_VIDEO}`, {
                params: { url: videoUrl },
                timeout: 30000
            });
            
            videoDownloadUrl = videoResponse.data?.downloadUrl || videoResponse.data?.result || videoResponse.data?.url;
        } catch (err) {
            console.log('Cinemind video failed:', err.message);
        }

        // If Cinemind failed, try alternative API
        if (!videoDownloadUrl) {
            try {
                const altResponse = await axios.post(`https://api.cobalt.tools/api/json`, {
                    url: videoUrl,
                    vQuality: '720',
                    aFormat: 'mp4'
                }, {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 30000
                });
                videoDownloadUrl = altResponse.data?.url;
            } catch (err) {
                console.log('Cobalt video failed:', err.message);
            }
        }

        if (!videoDownloadUrl) {
            return reply("❌ Failed to get video download link. Please try again later.");
        }

        // Send video
        await conn.sendMessage(from, {
            video: { url: videoDownloadUrl },
            caption: `🎬 *${videoTitle}*`,
            fileName: `${cleanTitle}.mp4`,
            mimetype: 'video/mp4'
        }, { quoted: mek });

        await conn.sendMessage(from, {
            react: { text: "✅", key: mek.key }
        });

    } catch (e) {
        console.error("Error in .video command:", e);
        await conn.sendMessage(from, {
            react: { text: "❌", key: mek.key }
        });
        reply("❌ Error: " + e.message);
    }
});

// Test command to check Cinemind API
cmd({
    pattern: "testapi",
    alias: ["checkapi"],
    react: "🔧",
    desc: "Test Cinemind API connection",
    category: "download",
    use: '.testapi',
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        await reply("🔧 Testing Cinemind API...");
        
        // Test search endpoint
        const testSearch = await axios.get(`${CINEMIND_API.BASE}${CINEMIND_API.YT_SEARCH}`, {
            params: { q: "test" },
            timeout: 10000
        });
        
        let message = "✅ Cinemind API Status:\n\n";
        message += `Search Endpoint: ${testSearch.status === 200 ? '✅ Working' : '❌ Failed'}\n`;
        message += `Response: ${testSearch.data?.status ? 'Has data' : 'No data'}\n\n`;
        
        if (testSearch.data?.data?.[0]) {
            message += `Sample Result:\n`;
            message += `Title: ${testSearch.data.data[0].title}\n`;
            message += `Channel: ${testSearch.data.data[0].channel}\n`;
        }
        
        await reply(message);
    } catch (error) {
        reply(`❌ API Test Failed:\n${error.message}`);
    }
});
