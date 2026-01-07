const Database = require('better-sqlite3');
const db = new Database('shopbot.db');

db.exec(`
    CREATE TABLE IF NOT EXISTS servers (
        id TEXT PRIMARY KEY,
        settings TEXT DEFAULT '{}'
    );
    
    CREATE TABLE IF NOT EXISTS shops (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        server_id TEXT,
        owner_id TEXT,
        channel_id TEXT,
        name TEXT,
        logo TEXT DEFAULT 'Ar',
        type TEXT DEFAULT 'normal',
        category TEXT DEFAULT 'عادي',
        mentions_left INTEGER DEFAULT 5,
        helpers TEXT DEFAULT '[]',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        rating_total INTEGER DEFAULT 0,
        rating_count INTEGER DEFAULT 0
    );
    
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        server_id TEXT,
        warnings INTEGER DEFAULT 0,
        banned INTEGER DEFAULT 0,
        ban_reason TEXT
    );
    
    CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        server_id TEXT,
        channel_id TEXT,
        user_id TEXT,
        type TEXT,
        status TEXT DEFAULT 'open',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS ratings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shop_id INTEGER,
        user_id TEXT,
        rating INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS transfers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        server_id TEXT,
        from_user TEXT,
        to_user TEXT,
        amount INTEGER,
        purpose TEXT,
        verified INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

module.exports = {
    getServer: (id) => {
        let row = db.prepare('SELECT * FROM servers WHERE id = ?').get(id);
        if (!row) {
            db.prepare('INSERT INTO servers (id, settings) VALUES (?, ?)').run(id, '{}');
            row = { id, settings: '{}' };
        }
        row.settings = JSON.parse(row.settings);
        return row;
    },

    updateServerSettings: (id, settings) => {
        db.prepare('UPDATE servers SET settings = ? WHERE id = ?').run(JSON.stringify(settings), id);
    },

    createShop: (data) => {
        const stmt = db.prepare(`INSERT INTO shops (server_id, owner_id, channel_id, name, logo, type, category, mentions_left) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
        return stmt.run(data.serverId, data.ownerId, data.channelId, data.name, data.logo, data.type, data.category, data.mentions);
    },

    getShop: (channelId) => {
        return db.prepare('SELECT * FROM shops WHERE channel_id = ?').get(channelId);
    },

    getShopsByServer: (serverId) => {
        return db.prepare('SELECT * FROM shops WHERE server_id = ?').all(serverId);
    },

    getShopsByOwner: (ownerId, serverId) => {
        return db.prepare('SELECT * FROM shops WHERE owner_id = ? AND server_id = ?').all(ownerId, serverId);
    },

    updateShopMentions: (channelId, mentions) => {
        db.prepare('UPDATE shops SET mentions_left = ? WHERE channel_id = ?').run(mentions, channelId);
    },

    addShopHelper: (channelId, helperId) => {
        const shop = db.prepare('SELECT helpers FROM shops WHERE channel_id = ?').get(channelId);
        if (shop) {
            const helpers = JSON.parse(shop.helpers);
            if (!helpers.includes(helperId)) {
                helpers.push(helperId);
                db.prepare('UPDATE shops SET helpers = ? WHERE channel_id = ?').run(JSON.stringify(helpers), channelId);
            }
        }
    },

    getUser: (id, serverId) => {
        let row = db.prepare('SELECT * FROM users WHERE id = ? AND server_id = ?').get(id, serverId);
        if (!row) {
            db.prepare('INSERT INTO users (id, server_id) VALUES (?, ?)').run(id, serverId);
            row = { id, server_id: serverId, warnings: 0, banned: 0, ban_reason: null };
        }
        return row;
    },

    addWarning: (id, serverId) => {
        db.prepare('UPDATE users SET warnings = warnings + 1 WHERE id = ? AND server_id = ?').run(id, serverId);
        return db.prepare('SELECT warnings FROM users WHERE id = ? AND server_id = ?').get(id, serverId);
    },

    banUser: (id, serverId, reason) => {
        db.prepare('UPDATE users SET banned = 1, ban_reason = ? WHERE id = ? AND server_id = ?').run(reason, id, serverId);
    },

    unbanUser: (id, serverId) => {
        db.prepare('UPDATE users SET banned = 0, ban_reason = NULL, warnings = 0 WHERE id = ? AND server_id = ?').run(id, serverId);
    },

    createTicket: (data) => {
        return db.prepare('INSERT INTO tickets (server_id, channel_id, user_id, type) VALUES (?, ?, ?, ?)').run(data.serverId, data.channelId, data.userId, data.type);
    },

    getTicket: (channelId) => {
        return db.prepare('SELECT * FROM tickets WHERE channel_id = ?').get(channelId);
    },

    closeTicket: (channelId) => {
        db.prepare('UPDATE tickets SET status = ? WHERE channel_id = ?').run('closed', channelId);
    },

    addRating: (shopId, userId, rating) => {
        const existing = db.prepare('SELECT * FROM ratings WHERE shop_id = ? AND user_id = ?').get(shopId, userId);
        if (existing) {
            db.prepare('UPDATE ratings SET rating = ? WHERE shop_id = ? AND user_id = ?').run(rating, shopId, userId);
        } else {
            db.prepare('INSERT INTO ratings (shop_id, user_id, rating) VALUES (?, ?, ?)').run(shopId, userId, rating);
        }
        const stats = db.prepare('SELECT COUNT(*) as count, SUM(rating) as total FROM ratings WHERE shop_id = ?').get(shopId);
        db.prepare('UPDATE shops SET rating_count = ?, rating_total = ? WHERE id = ?').run(stats.count, stats.total, shopId);
    },

    getTopShops: (serverId, limit = 10) => {
        return db.prepare(`SELECT *, CASE WHEN rating_count > 0 THEN CAST(rating_total AS FLOAT) / rating_count ELSE 0 END as avg_rating FROM shops WHERE server_id = ? ORDER BY avg_rating DESC LIMIT ?`).all(serverId, limit);
    },

    createTransfer: (data) => {
        return db.prepare('INSERT INTO transfers (server_id, from_user, to_user, amount, purpose) VALUES (?, ?, ?, ?, ?)').run(data.serverId, data.fromUser, data.toUser, data.amount, data.purpose);
    },

    verifyTransfer: (id) => {
        db.prepare('UPDATE transfers SET verified = 1 WHERE id = ?').run(id);
    },

    getBannedUsers: (serverId) => {
        return db.prepare('SELECT * FROM users WHERE server_id = ? AND banned = 1').all(serverId);
    },

    getAllRatings: (serverId) => {
        return db.prepare(`SELECT r.*, s.name as shop_name FROM ratings r JOIN shops s ON r.shop_id = s.id WHERE s.server_id = ?`).all(serverId);
    }
};
