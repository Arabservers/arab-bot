const db = require('./database');
const config = require('./config');

function getSettings(serverId) {
    const server = db.getServer(serverId);
    return { ...config.defaultSettings, ...server.settings };
}

function applyDecoration(text) {
    const decorations = ['『', '』', '【', '】', '「', '」', '〖', '〗', '《', '》'];
    const d1 = decorations[Math.floor(Math.random() * decorations.length)];
    const d2 = decorations[Math.floor(Math.random() * decorations.length)];
    return `${d1} ${text} ${d2}`;
}

function formatShopName(name, logo) {
    return applyDecoration(`${logo} | ${name}`);
}

function checkEncryption(message, settings) {
    const words = Object.keys(settings.encryptionWords);
    for (const word of words) {
        if (message.toLowerCase().includes(word.toLowerCase())) {
            return { valid: false, word };
        }
    }
    return { valid: true };
}

function getEncryptedWord(word, settings) {
    return settings.encryptionWords[word] || word;
}

async function handleMention(message, shop, settings) {
    const content = message.content;
    const hasEveryone = content.includes('@everyone');
    const hasHere = content.includes('@here');

    if (!hasEveryone && !hasHere) return null;

    if (shop.mentions_left <= 0) {
        return { allowed: false, remaining: 0 };
    }

    db.updateShopMentions(shop.channel_id, shop.mentions_left - 1);
    return { allowed: true, remaining: shop.mentions_left - 1 };
}

async function createShopChannel(guild, owner, shopData, settings) {
    const category = await guild.channels.create({
        name: `متاجر - ${shopData.category}`,
        type: 4
    }).catch(() => null);

    const channelName = formatShopName(shopData.name, shopData.logo);

    const channel = await guild.channels.create({
        name: channelName,
        type: 0,
        parent: category?.id,
        permissionOverwrites: [
            {
                id: guild.id,
                deny: ['SendMessages'],
                allow: ['ViewChannel']
            },
            {
                id: owner.id,
                allow: ['SendMessages', 'ManageMessages', 'AttachFiles', 'EmbedLinks']
            }
        ]
    });

    return channel;
}

async function addHelper(guild, shop, helperId) {
    const channel = guild.channels.cache.get(shop.channel_id);
    if (channel) {
        await channel.permissionOverwrites.create(helperId, {
            SendMessages: true,
            AttachFiles: true,
            EmbedLinks: true
        });
        db.addShopHelper(shop.channel_id, helperId);
        return true;
    }
    return false;
}

async function verifyProBotTransfer(message, expectedAmount, toUserId) {
    const channel = message.channel;
    const messages = await channel.messages.fetch({ limit: 20 });

    for (const [, msg] of messages) {
        if (msg.author.id === config.proBotId) {
            const embed = msg.embeds[0];
            if (embed) {
                const desc = embed.description || '';
                if (desc.includes(toUserId) && desc.includes(expectedAmount.toString())) {
                    return true;
                }
            }
        }
    }
    return false;
}

function getCategoryPrice(categoryName, settings) {
    const cat = settings.categories.find(c => c.name === categoryName);
    return cat ? cat.price : settings.categories[0].price;
}

function getShopTypeInfo(type, settings) {
    return settings.shopTypes[type] || settings.shopTypes.normal;
}

module.exports = {
    getSettings,
    applyDecoration,
    formatShopName,
    checkEncryption,
    getEncryptedWord,
    handleMention,
    createShopChannel,
    addHelper,
    verifyProBotTransfer,
    getCategoryPrice,
    getShopTypeInfo
};
