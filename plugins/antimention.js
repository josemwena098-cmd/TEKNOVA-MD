const { cmd } = require('../command');
const pluginSettings = require('../lib/pluginSettings');

// Handler: detects status mentions and deletes them when enabled for the group
cmd({ on: 'body' }, async (conn, m, store, {
    from,
    body,
    isGroup,
    isAdmins,
    isBotAdmins,
    reply,
    sender
}) => {
    try {
        if (!isGroup || !isBotAdmins) return;

        // Respect admins
        if (isAdmins) return;

        // Check per-group toggle
        let enabled = false;
        try {
            const override = await pluginSettings.get(from, 'antimention');
            if (override !== undefined) enabled = (override === true || String(override) === 'true' || String(override).toLowerCase() === 'on');
        } catch (e) {
            console.error('antimention: error reading plugin setting', e);
        }
        if (!enabled) return;

        const msg = m.message || {};
        // Collect mentioned JIDs from possible places
        let mentioned = [];
        try {
            if (msg.extendedTextMessage && msg.extendedTextMessage.contextInfo && msg.extendedTextMessage.contextInfo.mentionedJid) mentioned = msg.extendedTextMessage.contextInfo.mentionedJid;
            else if (msg.buttonsResponseMessage && msg.buttonsResponseMessage.contextInfo && msg.buttonsResponseMessage.contextInfo.mentionedJid) mentioned = msg.buttonsResponseMessage.contextInfo.mentionedJid;
            else if (msg.templateButtonReplyMessage && msg.templateButtonReplyMessage.contextInfo && msg.templateButtonReplyMessage.contextInfo.mentionedJid) mentioned = msg.templateButtonReplyMessage.contextInfo.mentionedJid;
        } catch (e) {
            mentioned = [];
        }

        const text = (body || '').toString().toLowerCase();

        // Check for status mention
        const isStatusMention = mentioned.includes('status@broadcast') || text.includes('status@broadcast');

        if (!isStatusMention) return;

        // Attempt to delete the offending message
        try {
            const deleteKey = { remoteJid: from, fromMe: false, id: m.key && m.key.id ? m.key.id : (m.id || ''), participant: m.key && m.key.participant ? m.key.participant : (m.participant || undefined) };
            await conn.sendMessage(from, { delete: deleteKey });
        } catch (e) {
            try { await conn.sendMessage(from, { delete: m.key }); } catch (err) { console.error('antimention: delete failed', err); }
        }

        // Notify the sender
        try {
            await conn.sendMessage(from, { text: `⚠️ @${sender.split('@')[0]} Status mention is illegal in this group.`, mentions: [sender] }, { quoted: m });
        } catch (e) {
            try { reply(`⚠️ Status mention is illegal in this group.`); } catch (err) { }
        }

    } catch (err) {
        console.error('antimention handler error:', err);
    }
});

// Command: toggle antimention per group (group admins only)
cmd({
    pattern: 'antimention',
    desc: 'Toggle anti-mention for status in this group (admins only)',
    category: 'group',
    filename: __filename
}, async (conn, mek, m, { from, args, isGroup, isAdmins, isBotAdmins, reply, sender }) => {
    try {
        if (!isGroup) return reply('❌ This command can only be used in groups.');
        if (!isAdmins) return reply('❌ Only group admins can toggle this setting.');
        if (!isBotAdmins) return reply('❌ Bot must be admin to enable this feature.');

        if (!args || !args.length) return reply('Usage: .antimention on|off|status');
        const val = String(args[0]).toLowerCase();

        if (val === 'status') {
            let current = false;
            try {
                const override = await pluginSettings.get(from, 'antimention');
                if (override !== undefined) current = (override === true || String(override) === 'true' || String(override).toLowerCase() === 'on');
            } catch (e) { }
            return reply(`🔒 Anti-mention status: ${current ? 'ON' : 'OFF'}`);
        }

        const enabled = (val === 'on' || val === 'true');

        await pluginSettings.set(from, 'antimention', enabled);
        return reply(`✅ Anti-mention for this group is now ${enabled ? 'ON' : 'OFF'}.`);
    } catch (e) {
        console.error('antimention command error:', e);
        return reply('⚠️ Failed to update setting.');
    }
});

module.exports = {};</content >
    <parameter name="filePath">c:\Users\T20\Documents\GitHub\ZTX GROUP\plugins\antimention.js