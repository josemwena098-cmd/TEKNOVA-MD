const { cmd } = require("../command");
const axios = require("axios");

const BASE_API = "https://api.cinemind.name.ng/api";

async function getYouTubeLinkFromQuery(query) {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const resp = await axios.get(searchUrl, { timeout: 15000 });
    const html = resp.data;
    const match = html.match(/ytInitialData\s*=\s*(\{.*?\});/s);
    if (!match || !match[1]) return null;

    let parsed;
    try {
        parsed = JSON.parse(match[1]);
    } catch (e) {
        return null;
    }

    const sections = parsed.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
    if (!Array.isArray(sections)) return null;

    for (const section of sections) {
        const items = section?.itemSectionRenderer?.contents;
        if (!Array.isArray(items)) continue;

        for (const item of items) {
            const videoRenderer = item?.videoRenderer;
            if (videoRenderer && videoRenderer.videoId) {
                return `https://www.youtube.com/watch?v=${videoRenderer.videoId}`;
            }
        }
    }

    return null;
}

function isUrl(input) {
    return typeof input === "string" && /^https?:\/\//i.test(input.trim());
}

cmd({
    pattern: "play",
    alias: ["p"],
    react: "🎵",
    desc: "Play song from YouTube search or URL",
    category: "music",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        let input = q ? q.trim() : "";
        if (!input) return reply("❌ Usage: .play <song name or YouTube URL>");

        let videoUrl;
        if (isUrl(input)) {
            videoUrl = input;
        } else {
            await reply(`🔎 Searching YouTube for '${input}'...`);
            videoUrl = await getYouTubeLinkFromQuery(input);
            if (!videoUrl) return reply("❌ Could not find video for that song name.");
        }

        await reply(`⏳ Downloading audio...`);

        const apiUrl = `${BASE_API}/ytmp3?apikey=Godszeal&url=${encodeURIComponent(videoUrl)}`;
        const response = await axios.get(apiUrl, { timeout: 120000 });

        if (!response || !response.data) {
            return reply("❌ Error: empty response from API.");
        }

        if (response.data && typeof response.data === "object" && response.data.url) {
            await conn.sendMessage(from, { audio: { url: response.data.url }, mimetype: 'audio/mpeg' }, { quoted: mek });
        } else {
            const output = JSON.stringify(response.data, null, 2);
            const replyText = `*YouTube MP3*\nURL: ${videoUrl}\n\n*Result:*\n${output}`;
            await conn.sendMessage(from, { text: replyText }, { quoted: mek });
        }

    } catch (error) {
        console.error("Play plugin error:", error);
        const errText = error.response?.data ? JSON.stringify(error.response.data, null, 2) : error.message;
        await reply(`❌ Play error: ${errText}`);
    }
});