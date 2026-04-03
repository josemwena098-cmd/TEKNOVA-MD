const axios = require('axios');
const config = require('../config');
const { cmd, commands } = require('../command');
const util = require("util");

cmd({
    pattern: "vv3",
    alias: ['retrive', '🔥'],
    desc: "Fetch and resend a ViewOnce message content (image/video/audio).",
    category: "misc",
    use: '<query>',
    filename: __filename
},
    async (conn, mek, m, { from, reply }) => {
        try {
        // Get quoted message properly
        const quotedMessage = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage ||
            mek.message?.imageMessage?.contextInfo?.quotedMessage ||
            mek.message?.videoMessage?.contextInfo?.quotedMessage ||
            mek.message?.audioMessage?.contextInfo?.quotedMessage;

        if (!quotedMessage) {
            return reply("Please reply to a ViewOnce message.");
        }

        // Check for ViewOnce media
        const hasViewOnce = quotedMessage.viewOnceMessageV2 ||
            (quotedMessage.imageMessage?.viewOnce) ||
            (quotedMessage.videoMessage?.viewOnce) ||
            (quotedMessage.audioMessage?.viewOnce);

        if (!hasViewOnce) {
            return reply("This is not a ViewOnce message.");
        }

        let mediaBuffer = null;
        let mediaType = '';
        let caption = '';

        // Extract media from viewOnceMessageV2
        if (quotedMessage.viewOnceMessageV2) {
            const innerMsg = quotedMessage.viewOnceMessageV2.message;

            if (innerMsg?.imageMessage) {
                mediaType = 'image';
                caption = innerMsg.imageMessage.caption || '';
                mediaBuffer = await conn.downloadAndSaveMediaMessage(innerMsg.imageMessage);
                return conn.sendMessage(from, { image: { url: mediaBuffer }, caption: caption }, { quoted: mek });
            } else if (innerMsg?.videoMessage) {
                mediaType = 'video';
                caption = innerMsg.videoMessage.caption || '';
                mediaBuffer = await conn.downloadAndSaveMediaMessage(innerMsg.videoMessage);
                return conn.sendMessage(from, { video: { url: mediaBuffer }, caption: caption }, { quoted: mek });
            } else if (innerMsg?.audioMessage) {
                mediaType = 'audio';
                mediaBuffer = await conn.downloadAndSaveMediaMessage(innerMsg.audioMessage);
                return conn.sendMessage(from, { audio: { url: mediaBuffer } }, { quoted: mek });
            }
        }
        // Handle regular messages with viewOnce flag
        else if (quotedMessage.imageMessage?.viewOnce) {
            caption = quotedMessage.imageMessage.caption || '';
            mediaBuffer = await conn.downloadAndSaveMediaMessage(quotedMessage.imageMessage);
            return conn.sendMessage(from, { image: { url: mediaBuffer }, caption: caption }, { quoted: mek });
        } else if (quotedMessage.videoMessage?.viewOnce) {
            caption = quotedMessage.videoMessage.caption || '';
            mediaBuffer = await conn.downloadAndSaveMediaMessage(quotedMessage.videoMessage);
            return conn.sendMessage(from, { video: { url: mediaBuffer }, caption: caption }, { quoted: mek });
        } else if (quotedMessage.audioMessage?.viewOnce) {
            mediaBuffer = await conn.downloadAndSaveMediaMessage(quotedMessage.audioMessage);
            return conn.sendMessage(from, { audio: { url: mediaBuffer } }, { quoted: mek });
        } else {
            return reply("Unsupported ViewOnce message type.");
        }
    } catch (e) {
        console.log("Error:", e);
        reply("An error occurred while fetching the ViewOnce message.");
    }
});

// if you want use the codes give me credit on your channel and repo in this file and my all files 

cmd({
    pattern: "vv2",
    alias: ['retrieve2', '🔥2'],
    desc: "Fetch and resend a ViewOnce message content (alternative implementation).",
    category: "misc",
    use: '<query>',
    filename: __filename
},
    async (conn, mek, m, { from, reply }) => {
        try {
        // Get quoted message properly
        const quotedMessage = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage ||
            mek.message?.imageMessage?.contextInfo?.quotedMessage ||
            mek.message?.videoMessage?.contextInfo?.quotedMessage ||
            mek.message?.audioMessage?.contextInfo?.quotedMessage;

        if (!quotedMessage) {
            return reply("Please reply to a ViewOnce message.");
        }

        // Check for ViewOnce media
        const hasViewOnce = quotedMessage.viewOnceMessageV2 ||
            (quotedMessage.imageMessage?.viewOnce) ||
            (quotedMessage.videoMessage?.viewOnce) ||
            (quotedMessage.audioMessage?.viewOnce);

        if (!hasViewOnce) {
            return reply("This is not a ViewOnce message.");
        }

        let mediaBuffer = null;
        let mediaType = '';
        let caption = '';

        // Extract media from viewOnceMessageV2
        if (quotedMessage.viewOnceMessageV2) {
            const innerMsg = quotedMessage.viewOnceMessageV2.message;

            if (innerMsg?.imageMessage) {
                mediaType = 'image';
                caption = innerMsg.imageMessage.caption || '';
                mediaBuffer = await conn.downloadAndSaveMediaMessage(innerMsg.imageMessage);
                return conn.sendMessage(from, { image: { url: mediaBuffer }, caption: caption }, { quoted: mek });
            } else if (innerMsg?.videoMessage) {
                mediaType = 'video';
                caption = innerMsg.videoMessage.caption || '';
                mediaBuffer = await conn.downloadAndSaveMediaMessage(innerMsg.videoMessage);
                return conn.sendMessage(from, { video: { url: mediaBuffer }, caption: caption }, { quoted: mek });
            } else if (innerMsg?.audioMessage) {
                mediaType = 'audio';
                mediaBuffer = await conn.downloadAndSaveMediaMessage(innerMsg.audioMessage);
                return conn.sendMessage(from, { audio: { url: mediaBuffer } }, { quoted: mek });
            }
        }
        // Handle regular messages with viewOnce flag
        else if (quotedMessage.imageMessage?.viewOnce) {
            caption = quotedMessage.imageMessage.caption || '';
            mediaBuffer = await conn.downloadAndSaveMediaMessage(quotedMessage.imageMessage);
            return conn.sendMessage(from, { image: { url: mediaBuffer }, caption: caption }, { quoted: mek });
        } else if (quotedMessage.videoMessage?.viewOnce) {
            caption = quotedMessage.videoMessage.caption || '';
            mediaBuffer = await conn.downloadAndSaveMediaMessage(quotedMessage.videoMessage);
            return conn.sendMessage(from, { video: { url: mediaBuffer }, caption: caption }, { quoted: mek });
        } else if (quotedMessage.audioMessage?.viewOnce) {
            mediaBuffer = await conn.downloadAndSaveMediaMessage(quotedMessage.audioMessage);
            return conn.sendMessage(from, { audio: { url: mediaBuffer } }, { quoted: mek });
        } else {
            return reply("Unsupported ViewOnce message type.");
        }
    } catch (e) {
        console.log("Error:", e);
        reply("An error occurred while fetching the ViewOnce message.");
    }
});
