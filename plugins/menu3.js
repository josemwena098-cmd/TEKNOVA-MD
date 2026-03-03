const { cmd } = require('../command');
const { getPrefix } = require('../lib/prefix');
const config = require('../config');
const moment = require('moment-timezone');

cmd({
    pattern: 'menu3',
    alias: ['menu3', 'hmenu'],
    desc: 'Show list menu',
    category: 'menu',
    react: '',
    filename: __filename
}, async (conn, mek, m, { from, sender, isGroup, reply }) => {
    try {
        const prefix = getPrefix();
        const caption = **
**  NYX MD Bot Menu List
** Owner: NYX Development
** Prefix: ${prefix}
** Version: 1.0.0
**

Select a category to view commands.;

        if (isGroup) {
            await conn.sendMessage(from, { text: caption }, { quoted: mek });
            return;
        }

        await conn.sendMessage(from, { text: caption }, { quoted: mek });
    } catch (error) {
        console.error('Menu3 Error:', error);
        reply(' An error occurred while displaying the menu.');
    }
});
