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

// Facebook Video Download v1
cmd({
    pattern: "fb",
    alias: ["facebook", "fbdl", "fbvideo"],
    react: '📥',
    desc: "Download videos from Facebook",
    category: "download",
    use: ".fb <Facebook video URL>",
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        const fbUrl = q || m.quoted?.text;
        if (!fbUrl || !fbUrl.includes("facebook.com")) {
            return reply('❌ Please provide a valid Facebook video URL.\n\nExample: .fb https://facebook.com/...');
        }

        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        const downloadAPIs = [
            {
                type: 'davidcyril-1',
                url: `https://apis.davidcyriltech.my.id/facebook?url=${encodeURIComponent(fbUrl)}`,
                timeout: 20000,
                validate: (data) => data?.status && data?.result?.downloads
            },
            {
                type: 'davidcyril-2',
                url: `https://apis.davidcyriltech.my.id/facebook2?url=${encodeURIComponent(fbUrl)}`,
                timeout: 20000,
                validate: (data) => data?.status && data?.video?.downloads
            },
            {
                type: 'davidcyril-3',
                url: `https://apis.davidcyriltech.my.id/facebook3?url=${encodeURIComponent(fbUrl)}`,
                timeout: 20000,
                validate: (data) => data?.status && data?.results?.download
            }
        ];

        const result = await tryMultipleAPIs(downloadAPIs);
        if (!result.success) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply('❌ Unable to download video. URL may be private, expired, or unsupported.');
        }

        let videoUrl, title, quality = "HD";

        if (result.type === 'davidcyril-1') {
            const downloads = result.data.result.downloads;
            videoUrl = downloads.hd?.url || downloads.sd?.url;
            title = result.data.result.title || "Facebook Video";
            quality = downloads.hd ? "HD" : "SD";
        } else if (result.type === 'davidcyril-2') {
            const downloads = result.data.video.downloads;
            videoUrl = downloads.find(d => d.quality === "HD")?.downloadUrl || downloads[0]?.downloadUrl;
            title = result.data.video.title || "Facebook Video";
        } else {
            const download = result.data.results.download;
            videoUrl = download.hdVideos?.videoUrl || download.sdVideos?.videoUrl;
            title = result.data.results.title || "Facebook Video";
            quality = download.hdVideos ? "HD" : "SD";
        }

        if (!videoUrl) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply('❌ Could not extract download link from API.');
        }

        await conn.sendMessage(from, {
            video: { url: videoUrl },
            caption: `📥 *Facebook Video Download*\n📊 *Quality:* ${quality}\n✅ Download Complete`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
    } catch (error) {
        console.error('Facebook Error:', error);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        reply(`❌ Error: ${error.message}`);
    }
});

// Facebook Video Download v2 (Alternative)
cmd({
    pattern: "fb2",
    alias: ["facebook2", "fbvideo2", "fbdl2"],
    react: '📥',
    desc: "Download videos from Facebook (Alternative API)",
    category: "download",
    use: ".fb2 <Facebook video URL>",
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        const fbUrl = q || m.quoted?.text;
        if (!fbUrl || !fbUrl.includes("facebook.com")) {
            return reply('❌ Please provide a valid Facebook video URL.');
        }

        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        const downloadAPIs = [
            {
                type: 'bk9',
                url: `https://bk9.fun/download/facebook?url=${encodeURIComponent(fbUrl)}`,
                timeout: 20000,
                validate: (data) => data?.status && data?.BK9?.video
            },
            {
                type: 'rest-lily',
                url: `https://rest-lily.vercel.app/api/download/fb?url=${encodeURIComponent(fbUrl)}`,
                timeout: 20000,
                validate: (data) => data?.status && data?.result
            }
        ];

        const result = await tryMultipleAPIs(downloadAPIs);
        if (!result.success) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply('❌ Download failed. Try .fb command instead.');
        }

        let videoUrl;
        if (result.type === 'bk9') {
            videoUrl = result.data.BK9.video;
        } else {
            videoUrl = result.data.result;
        }

        await conn.sendMessage(from, {
            video: { url: videoUrl },
            caption: `📥 *Facebook Video Downloaded*\n✅ Ready to play`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
    } catch (error) {
        console.error('FB2 Error:', error);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        reply(`❌ Error: ${error.message}`);
    }
});
