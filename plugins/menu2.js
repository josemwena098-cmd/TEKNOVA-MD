const { cmd } = require('../command');
const moment = require('moment-timezone');
const config = require('../config');
const { getPrefix } = require('../lib/prefix');

cmd({
    pattern: 'menu2',
    alias: ['menu2', 'panel'],
    desc: 'Show button menu',
    category: 'menu',
    react: '',
    filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
    try {
        const prefix = getPrefix();
        const caption = **
**  Welcome to NYX MD Bot
** Version: 1.0.0
** Prefix: ${prefix}
** Owner: NYX Team
**

Use the commands below to get started.;

        await conn.sendMessage(from, { text: caption }, { quoted: mek });
    } catch (error) {
        console.error('Menu2 Error:', error);
        reply(' Error displaying menu. Please try again.');
    }
});
