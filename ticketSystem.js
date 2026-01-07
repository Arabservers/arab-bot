const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const db = require('./database');
const shopSystem = require('./shopSystem');
const config = require('./config');

async function createTicketChannel(guild, user, type, settings) {
    const ticketChannel = await guild.channels.create({
        name: `🎫│${user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
            {
                id: guild.id,
                deny: [PermissionFlagsBits.ViewChannel]
            },
            {
                id: user.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
            }
        ]
    });

    db.createTicket({
        serverId: guild.id,
        channelId: ticketChannel.id,
        userId: user.id,
        type
    });

    return ticketChannel;
}

async function sendTicketPanel(channel, settings) {
    const embed = new EmbedBuilder()
        .setTitle('```🛒 نظام المتاجر```')
        .setDescription('╭─────────────────────╮\n│     **اختر نوع الخدمة**     │\n╰─────────────────────╯')
        .setColor(0x5865F2)
        .setThumbnail(channel.guild.iconURL({ size: 256 }))
        .addFields(
            { name: '🏪 شراء متجر', value: '```إنشاء متجرك الخاص```', inline: true },
            { name: '📢 منشنات', value: '```شراء منشنات إضافية```', inline: true },
            { name: '👥 مساعد', value: '```إضافة مساعد لمتجرك```', inline: true }
        )
        .setFooter({ text: `✨ ${settings.shopLogo || 'AS'} Shop System` })
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ticket_shop').setLabel('شراء متجر').setStyle(ButtonStyle.Primary).setEmoji('🏪'),
        new ButtonBuilder().setCustomId('ticket_mentions').setLabel('منشنات').setStyle(ButtonStyle.Success).setEmoji('📢'),
        new ButtonBuilder().setCustomId('ticket_helper').setLabel('مساعد').setStyle(ButtonStyle.Secondary).setEmoji('👥')
    );

    await channel.send({ embeds: [embed], components: [row] });
}

async function handleShopPurchase(interaction, settings) {
    const categories = settings.categories || config.defaultSettings.categories;
    const shopTypes = settings.shopTypes || config.defaultSettings.shopTypes;

    let catList = '';
    categories.forEach((cat, i) => {
        catList += `> **${i + 1}.** ${cat.name} ─ \`${cat.price}\` كريدت\n`;
    });

    let typeList = '';
    Object.entries(shopTypes).forEach(([type, info]) => {
        const emoji = type === 'good' ? '👑' : '📦';
        typeList += `> ${emoji} **${type}** ─ \`${info.mentions}\` منشن ─ \`${info.price}\` كريدت\n`;
    });

    const embed = new EmbedBuilder()
        .setTitle('```🏪 شراء متجر جديد```')
        .setDescription('╭─────────────────────╮')
        .setColor(0x00FF88)
        .addFields(
            { name: '📁 الفئات المتاحة', value: catList },
            { name: '📦 أنواع المتاجر', value: typeList },
            { name: '📝 التعليمات', value: '```أرسل اسم متجرك فقط```' }
        )
        .setFooter({ text: '✨ اختر النوع والفئة أولاً' });

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('shop_normal').setLabel('عادي 📦').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('shop_good').setLabel('مميز 👑').setStyle(ButtonStyle.Success)
    );

    const row2 = new ActionRowBuilder();
    categories.slice(0, 5).forEach((cat, i) => {
        row2.addComponents(
            new ButtonBuilder().setCustomId(`cat_${i}`).setLabel(cat.name).setStyle(ButtonStyle.Secondary)
        );
    });

    await interaction.reply({ embeds: [embed], components: [row1, row2], ephemeral: true });
}

async function handleMentionsPurchase(interaction, settings) {
    const shop = db.getShopsByOwner(interaction.user.id, interaction.guild.id)[0];

    if (!shop) {
        const embed = new EmbedBuilder()
            .setTitle('```❌ خطأ```')
            .setDescription('> ليس لديك متجر بعد!')
            .setColor(0xFF0000);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const embed = new EmbedBuilder()
        .setTitle('```📢 شراء منشنات```')
        .setDescription('╭─────────────────────╮')
        .setColor(0xFFAA00)
        .addFields(
            { name: '💰 السعر', value: `> \`${settings.mentionPrice || 500}\` كريدت / منشن`, inline: true },
            { name: '📊 رصيدك', value: `> \`${shop.mentions_left}\` منشن متبقي`, inline: true }
        )
        .setFooter({ text: '✨ اختر الكمية المطلوبة' });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('buy_1mention').setLabel('1 منشن').setStyle(ButtonStyle.Primary).setEmoji('1️⃣'),
        new ButtonBuilder().setCustomId('buy_5mentions').setLabel('5 منشنات').setStyle(ButtonStyle.Success).setEmoji('5️⃣'),
        new ButtonBuilder().setCustomId('buy_10mentions').setLabel('10 منشنات').setStyle(ButtonStyle.Danger).setEmoji('🔟')
    );

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}

async function handleHelperPurchase(interaction, settings) {
    const shop = db.getShopsByOwner(interaction.user.id, interaction.guild.id)[0];

    if (!shop) {
        const embed = new EmbedBuilder()
            .setTitle('```❌ خطأ```')
            .setDescription('> ليس لديك متجر بعد!')
            .setColor(0xFF0000);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const embed = new EmbedBuilder()
        .setTitle('```👥 إضافة مساعد```')
        .setDescription('╭─────────────────────╮')
        .setColor(0x9B59B6)
        .addFields(
            { name: '💰 السعر', value: `> \`${settings.helperPrice || 2000}\` كريدت` },
            { name: '📝 التعليمات', value: '> اذكر الشخص الذي تريد إضافته\n> مثال: @username' }
        )
        .setFooter({ text: '✨ المساعد يستطيع الإرسال في متجرك' });

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function sendEncryptionButtons(channel, settings) {
    const words = Object.entries(settings.encryptionWords || config.defaultSettings.encryptionWords);

    let wordList = '';
    words.forEach(([original, encrypted]) => {
        wordList += `> **${original}** ➜ \`${encrypted}\`\n`;
    });

    const embed = new EmbedBuilder()
        .setTitle('```🔐 كلمات التشفير```')
        .setDescription('╭─────────────────────╮\n' + wordList + '╰─────────────────────╯')
        .setColor(0xE74C3C)
        .setFooter({ text: '⚠️ استخدم الكلمات المشفرة لتجنب التحذيرات' });

    const row = new ActionRowBuilder();
    words.slice(0, 5).forEach(([original, encrypted]) => {
        row.addComponents(
            new ButtonBuilder().setCustomId(`copy_${encrypted}`).setLabel(encrypted).setStyle(ButtonStyle.Secondary)
        );
    });

    await channel.send({ embeds: [embed], components: [row] });
}

async function sendRatingPanel(channel, shopId) {
    const embed = new EmbedBuilder()
        .setTitle('```⭐ تقييم المتجر```')
        .setDescription('╭─────────────────────╮\n│   **قيم تجربتك مع المتجر**   │\n╰─────────────────────╯')
        .setColor(0xF1C40F)
        .setFooter({ text: '✨ تقييمك يساعد في تحسين الخدمة' });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`rate_1_${shopId}`).setLabel('1').setStyle(ButtonStyle.Secondary).setEmoji('⭐'),
        new ButtonBuilder().setCustomId(`rate_2_${shopId}`).setLabel('2').setStyle(ButtonStyle.Secondary).setEmoji('⭐'),
        new ButtonBuilder().setCustomId(`rate_3_${shopId}`).setLabel('3').setStyle(ButtonStyle.Primary).setEmoji('⭐'),
        new ButtonBuilder().setCustomId(`rate_4_${shopId}`).setLabel('4').setStyle(ButtonStyle.Success).setEmoji('⭐'),
        new ButtonBuilder().setCustomId(`rate_5_${shopId}`).setLabel('5').setStyle(ButtonStyle.Success).setEmoji('🌟')
    );

    await channel.send({ embeds: [embed], components: [row] });
}

async function closeTicket(channel) {
    db.closeTicket(channel.id);
    await channel.delete().catch(() => { });
}

module.exports = {
    createTicketChannel,
    sendTicketPanel,
    handleShopPurchase,
    handleMentionsPurchase,
    handleHelperPurchase,
    sendEncryptionButtons,
    sendRatingPanel,
    closeTicket
};
