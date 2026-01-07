const express = require('express');
const session = require('express-session');
const axios = require('axios');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const PORT = 20818;

const db = new Database(path.join(__dirname, '..', 'shopbot.db'));

const CLIENT_ID = '1458432385950552220';
const CLIENT_SECRET = 'X53gnR-kO8vWIFXZP47sZhUWSTXV7gCv';
const REDIRECT_URI = 'http://arab-bot-discord.vercel.app/callback';
const INVITE_URL = 'https://discord.com/oauth2/authorize?client_id=1458432385950552220&permissions=8&integration_type=0&scope=bot';

app.use(express.json());
app.use(express.static(__dirname));
app.use(session({
    secret: 'shopbot-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 86400000 }
}));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login', (req, res) => {
    res.redirect('https://discord.com/oauth2/authorize?client_id=1458432385950552220&response_type=code&redirect_uri=http%3A%2F%2Farab-bot-discord.vercel.app%2Fcallback&scope=identify+guilds');
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

        req.session.user = userRes.data;
        req.session.accessToken = accessToken;
        req.session.guilds = guildsRes.data.filter(g => (g.permissions & 0x8) === 0x8 || g.owner);

        res.redirect('/dashboard.html');
    } catch (error) {
        console.error('Auth error:', error.response?.data || error.message);
        res.redirect('/');
    }
});

app.get('/api/user', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
    res.json({ user: req.session.user, guilds: req.session.guilds || [] });
});

app.get('/api/server/:id', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });

    const serverId = req.params.id;
    const guild = req.session.guilds?.find(g => g.id === serverId);
    if (!guild) return res.status(403).json({ error: 'No access' });

    let row = db.prepare('SELECT * FROM servers WHERE id = ?').get(serverId);
    if (!row) {
        db.prepare('INSERT INTO servers (id, settings) VALUES (?, ?)').run(serverId, '{}');
        row = { id: serverId, settings: '{}' };
    }

    const settings = JSON.parse(row.settings);
    const shops = db.prepare('SELECT * FROM shops WHERE server_id = ?').all(serverId);
    const bannedUsers = db.prepare('SELECT * FROM users WHERE server_id = ? AND banned = 1').all(serverId);
    const ratings = db.prepare(`SELECT r.*, s.name as shop_name FROM ratings r JOIN shops s ON r.shop_id = s.id WHERE s.server_id = ?`).all(serverId);
    const topShops = db.prepare(`SELECT *, CASE WHEN rating_count > 0 THEN CAST(rating_total AS FLOAT) / rating_count ELSE 0 END as avg_rating FROM shops WHERE server_id = ? ORDER BY avg_rating DESC LIMIT 10`).all(serverId);

    res.json({
        guild,
        settings,
        shops,
        bannedUsers,
        ratings,
        topShops,
        inviteUrl: INVITE_URL
    });
});

app.post('/api/server/:id/settings', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });

    const serverId = req.params.id;
    const guild = req.session.guilds?.find(g => g.id === serverId);
    if (!guild) return res.status(403).json({ error: 'No access' });

    const settings = req.body;
    db.prepare('UPDATE servers SET settings = ? WHERE id = ?').run(JSON.stringify(settings), serverId);

    res.json({ success: true });
});

app.post('/api/server/:id/unban/:userId', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });

    const { id: serverId, userId } = req.params;
    const guild = req.session.guilds?.find(g => g.id === serverId);
    if (!guild) return res.status(403).json({ error: 'No access' });

    db.prepare('UPDATE users SET banned = 0, warnings = 0, ban_reason = NULL WHERE id = ? AND server_id = ?').run(userId, serverId);
    res.json({ success: true });
});

app.post('/api/server/:id/ban', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });

    const serverId = req.params.id;
    const { userId, reason } = req.body;
    const guild = req.session.guilds?.find(g => g.id === serverId);
    if (!guild) return res.status(403).json({ error: 'No access' });

    let user = db.prepare('SELECT * FROM users WHERE id = ? AND server_id = ?').get(userId, serverId);
    if (!user) {
        db.prepare('INSERT INTO users (id, server_id) VALUES (?, ?)').run(userId, serverId);
    }
    db.prepare('UPDATE users SET banned = 1, ban_reason = ? WHERE id = ? AND server_id = ?').run(reason || 'بان من الداشبورد', userId, serverId);
    res.json({ success: true });
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Dashboard running on http://arab-bot-discord.vercel.app`);
});
