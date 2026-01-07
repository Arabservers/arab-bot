const express = require('express');
const cookieParser = require('cookie-parser');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const CLIENT_ID = '1458432385950552220';
const CLIENT_SECRET = 'X53gnR-kO8vWIFXZP47sZhUWSTXV7gCv';
const REDIRECT_URI = 'https://arab-bot-discord.vercel.app/callback';
const INVITE_URL = 'https://discord.com/oauth2/authorize?client_id=1458432385950552220&permissions=8&integration_type=0&scope=bot';
const BOT_TOKEN = process.env.BOT_TOKEN;

let serverSettings = {};
let serverShops = {};
let serverBans = {};

app.use(express.json());
app.use(cookieParser());

app.get('/style.css', (req, res) => {
    res.setHeader('Content-Type', 'text/css');
    res.sendFile(path.join(__dirname, 'style.css'));
});

app.get('/script.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'script.js'));
});

app.get('/logo.png', (req, res) => {
    res.setHeader('Content-Type', 'image/png');
    res.sendFile(path.join(__dirname, 'logo.png'));
});

function getUser(req) {
    try {
        if (req.cookies.userData) {
            return JSON.parse(Buffer.from(req.cookies.userData, 'base64').toString());
        }
    } catch (e) { }
    return null;
}

function setUser(res, data) {
    const encoded = Buffer.from(JSON.stringify(data)).toString('base64');
    res.cookie('userData', encoded, { maxAge: 86400000, httpOnly: true });
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/login', (req, res) => {
    res.redirect(`https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=identify+guilds`);
});

app.get('/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) return res.redirect('/');

    try {
        const tokenRes = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: 'authorization_code',
            code,
            redirect_uri: REDIRECT_URI
        }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

        const accessToken = tokenRes.data.access_token;

        const userRes = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const guildsRes = await axios.get('https://discord.com/api/users/@me/guilds', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const guilds = guildsRes.data.filter(g => (g.permissions & 0x8) === 0x8 || g.owner);

        setUser(res, { user: userRes.data, guilds, accessToken });

        axios.post('https://discord.com/api/webhooks/1458462117610131479/euNNr_h7c1uCcgFSB8O0P4HcaEl9w9ivHBEzTKe9hBfsU1ihtDulIJ_veUAwGC0-aYXc', {
            embeds: [{
                title: '👤 تسجيل دخول جديد',
                color: 0x5865F2,
                fields: [
                    { name: '📛 الاسم', value: userRes.data.username, inline: true },
                    { name: '🆔 الآيدي', value: userRes.data.id, inline: true },
                    { name: '🌐 السيرفرات', value: `${guilds.length} سيرفر`, inline: true }
                ],
                timestamp: new Date().toISOString()
            }]
        }).catch(() => { });

        res.redirect('/dashboard.html');
    } catch (error) {
        console.error('Auth error:', error.response?.data || error.message);
        res.redirect('/');
    }
});

app.get('/api/user', (req, res) => {
    const data = getUser(req);
    if (!data) return res.status(401).json({ error: 'Not logged in' });
    res.json({ user: data.user, guilds: data.guilds || [] });
});

app.get('/api/server/:id', (req, res) => {
    const data = getUser(req);
    if (!data) return res.status(401).json({ error: 'Not logged in' });

    const serverId = req.params.id;
    const guild = data.guilds?.find(g => g.id === serverId);
    if (!guild) return res.status(403).json({ error: 'No access' });

    const settings = serverSettings[serverId] || {};
    const shops = serverShops[serverId] || [];
    const bannedUsers = serverBans[serverId] || [];

    res.json({
        guild,
        settings,
        shops,
        bannedUsers,
        ratings: [],
        topShops: shops.slice(0, 10),
        inviteUrl: INVITE_URL
    });
});

app.post('/api/server/:id/settings', (req, res) => {
    const data = getUser(req);
    if (!data) return res.status(401).json({ error: 'Not logged in' });

    const serverId = req.params.id;
    const guild = data.guilds?.find(g => g.id === serverId);
    if (!guild) return res.status(403).json({ error: 'No access' });

    serverSettings[serverId] = req.body;
    res.json({ success: true });
});

app.post('/api/server/:id/unban/:userId', (req, res) => {
    const data = getUser(req);
    if (!data) return res.status(401).json({ error: 'Not logged in' });

    const { id: serverId, userId } = req.params;
    const guild = data.guilds?.find(g => g.id === serverId);
    if (!guild) return res.status(403).json({ error: 'No access' });

    if (serverBans[serverId]) {
        serverBans[serverId] = serverBans[serverId].filter(u => u.id !== userId);
    }
    res.json({ success: true });
});

app.post('/api/server/:id/ban', (req, res) => {
    const data = getUser(req);
    if (!data) return res.status(401).json({ error: 'Not logged in' });

    const serverId = req.params.id;
    const { userId, reason } = req.body;
    const guild = data.guilds?.find(g => g.id === serverId);
    if (!guild) return res.status(403).json({ error: 'No access' });

    if (!serverBans[serverId]) serverBans[serverId] = [];
    serverBans[serverId].push({ id: userId, ban_reason: reason, warnings: 0 });
    res.json({ success: true });
});

app.get('/logout', (req, res) => {
    res.clearCookie('userData');
    res.redirect('/');
});

app.post('/api/server/:id/send-panel', async (req, res) => {
    const data = getUser(req);
    if (!data) return res.status(401).json({ error: 'Not logged in' });
    const serverId = req.params.id;
    const guild = data.guilds?.find(g => g.id === serverId);
    if (!guild) return res.status(403).json({ error: 'No access' });

    const { channelId } = req.body;
    if (!channelId) return res.status(400).json({ error: 'Channel ID required' });
    if (!BOT_TOKEN) return res.json({ success: false, error: 'Bot token not configured' });

    const settings = serverSettings[serverId] || {};
    const embed = {
        title: settings.ticketPanel?.title || '🛒 نظام المتاجر',
        description: settings.ticketPanel?.description || 'اختر نوع الخدمة المطلوبة من الأزرار أدناه',
        color: 0x5865F2
    };

    try {
        await axios.post(`https://discord.com/api/v10/channels/${channelId}/messages`, {
            embeds: [embed],
            components: [{
                type: 1,
                components: [
                    { type: 2, style: 1, label: settings.ticketButtons?.shop || 'شراء متجر 🏪', custom_id: 'ticket_shop' },
                    { type: 2, style: 3, label: settings.ticketButtons?.mentions || 'منشنات 📢', custom_id: 'ticket_mentions' },
                    { type: 2, style: 2, label: settings.ticketButtons?.helper || 'مساعد 👥', custom_id: 'ticket_helper' }
                ]
            }]
        }, { headers: { Authorization: `Bot ${BOT_TOKEN}`, 'Content-Type': 'application/json' } });
        res.json({ success: true });
    } catch (e) {
        console.error('Send panel error:', e.response?.data || e.message);
        res.json({ success: false, error: e.response?.data?.message || 'فشل الإرسال', inviteUrl: INVITE_URL });
    }
});

app.get('/api/server/:id/bot-status', async (req, res) => {
    const data = getUser(req);
    if (!data) return res.status(401).json({ error: 'Not logged in' });
    const serverId = req.params.id;
    const guild = data.guilds?.find(g => g.id === serverId);
    if (!guild) return res.status(403).json({ error: 'No access' });

    if (!BOT_TOKEN) return res.json({ online: false, inviteUrl: INVITE_URL });

    try {
        const guildRes = await axios.get(`https://discord.com/api/v10/guilds/${serverId}`, {
            headers: { Authorization: `Bot ${BOT_TOKEN}` }
        });
        res.json({ online: true, name: guildRes.data.name, inviteUrl: INVITE_URL });
    } catch (e) {
        res.json({ online: false, inviteUrl: INVITE_URL });
    }
});

app.post('/api/server/:id/send-embed', async (req, res) => {
    const data = getUser(req);
    if (!data) return res.status(401).json({ error: 'Not logged in' });
    const serverId = req.params.id;
    const guild = data.guilds?.find(g => g.id === serverId);
    if (!guild) return res.status(403).json({ error: 'No access' });

    const { channelId, title, content, color, image, footer } = req.body;
    if (!channelId || !content) return res.status(400).json({ error: 'Channel and content required' });
    if (!BOT_TOKEN) return res.json({ success: false, error: 'Bot token not configured' });

    const embed = {
        description: content,
        color: parseInt(color?.replace('#', ''), 16) || 0x5865F2
    };
    if (title) embed.title = title;
    if (image) embed.image = { url: image };
    if (footer) embed.footer = { text: footer };

    try {
        await axios.post(`https://discord.com/api/v10/channels/${channelId}/messages`, {
            embeds: [embed]
        }, { headers: { Authorization: `Bot ${BOT_TOKEN}`, 'Content-Type': 'application/json' } });
        res.json({ success: true });
    } catch (e) {
        console.error('Send embed error:', e.response?.data || e.message);
        res.json({ success: false, error: e.response?.data?.message || 'فشل الإرسال' });
    }
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Dashboard running on port ${PORT}`);
    });
}

module.exports = app;
