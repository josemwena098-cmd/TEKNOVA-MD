const { cmd, commands } = require('../command');
const os = require('os');
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson, jsonformat } = require('../lib/functions');
const config = require('../config');

cmd({
    pattern: 'alive',
    alias: ['status', 'live'],
    desc: 'Check uptime and system status',
    category: 'main',
    react: '🟢',
    filename: __filename
},
    async (conn, mek, m, { from, sender, reply }) => {
        try {
            const totalCmds = commands.length;
            const up = runtime(process.uptime());

            const mem = process.memoryUsage();
            const usedMB = (mem.heapUsed / 1024 / 1024).toFixed(2);
            const totalMB = (mem.heapTotal / 1024 / 1024).toFixed(2);

            const platform = `${os.type()} ${os.release()} ${os.arch()}`;
            const cpu = os.cpus()[0].model;

            const status = `╔═════════════════════════╗
║    ✨ *${config.BOT_NAME || 'NYX MD'}* ✨    ║
║   🤖 STATUS: ALIVE...🧚‍♂️   ║
╚═════════════════════════╝

╭
│ 👑 Owner: ${config.OWNER_NAME || 'Owner'}
│ 🔑 Prefix: ${config.PREFIX || '.'}
│ 🏷️ Version: 3.0.0
│ 📦 Commands: ${totalCmds}
│ ⏱️ Uptime: ${up}
│ 💾 Memory: ${usedMB}MB / ${totalMB}MB
│ 🖥️ Platform: ${platform}
│ ⚙️ CPU: ${cpu.substring(0, 30)}...
├─────────────────────────────┤

*> Made with ❤️ by BLAZE TECH*`;

            const buttons = [
                {
                    buttonId: ".owner",
                    buttonText: { displayText: "❭❭ 𝗢𝗪𝗡𝗘𝗥🧑‍💻" },
                    type: 1
                },
                {
                    buttonId: ".ping",
                    buttonText: { displayText: "❭❭ 𝗣𝗜𝗡𝗚📍" },
                    type: 1
                },
                {
                    buttonId: ".menu",
                    buttonText: { displayText: "❭❭ MENU 📂" },
                    type: 1
                }
            ];

            await conn.sendMessage(
                from,
                {
                    image: { url: config.ALIVE_IMG },
                    caption: status,
                    buttons,
                    headerType: 1,
                    viewOnce: true,
                    contextInfo: {
                        mentionedJid: [sender]
                    }
                },
                { quoted: mek }
            );

        } catch (e) {
            console.error("Alive Error:", e);
            reply(`❌ Error: ${e.message}`);
        }
    });
