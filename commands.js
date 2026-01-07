const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const db = require('./database');
const shopSystem = require('./shopSystem');
const ticketSystem = require('./ticketSystem');
const config = require('./config');

async function handleCommand(message) {
    const settings = shopSystem.getSettings(message.guild.id);
    const content = message.content.toLowerCase();

    if (content === '-بوت' || content === '-bot') {
        await sendBotPanel(message, settings);
        return true;
    }

    if (content === '-تكت' || content === '-ticket') {
        await ticketSystem.sendTicketPanel(message.channel, settings);
        return true;
    }

    if (content === '-تشفير' || content === '-encrypt') {
        await ticketSystem.sendEncryptionButtons(message.channel, settings);
        return true;
    }

    if (content.startsWith('-بان ') || content.startsWith('-ban ')) {
        if (!message.member.permissions.has('Administrator')) {
            const embed = new EmbedBuilder()
                .setDescription('```❌ ليس لديك صلاحية```')
                .setColor(0xFF0000);
            return message.reply({ embeds: [embed] });
        }
        const target = message.mentions.users.first();
        if (!target) {
            const embed = new EmbedBuilder()
                .setDescription('```❌ اذكر الشخص المراد حظره```')
                .setColor(0xFF0000);
            return message.reply({ embeds: [embed] });
        }
        const reason = content.split(' ').slice(2).join(' ') || 'لا يوجد سبب';
        db.banUser(target.id, message.guild.id, reason);
        const embed = new EmbedBuilder()
            .setTitle('```🚫 تم الحظر```')
            .setDescription(`> تم حظر ${target} من إنشاء المتاجر`)
            .addFields({ name: '📝 السبب', value: `\`\`\`${reason}\`\`\`` })
            .setColor(0xFF0000)
            .setTimestamp();
        await message.reply({ embeds: [embed] });
        return true;
    }

    if (content.startsWith('-انبان ') || content.startsWith('-unban ')) {
        if (!message.member.permissions.has('Administrator')) {
            const embed = new EmbedBuilder()
                .setDescription('```❌ ليس لديك صلاحية```')
                .setColor(0xFF0000);
            return message.reply({ embeds: [embed] });
        }
        const target = message.mentions.users.first();
        if (!target) {
            const embed = new EmbedBuilder()
                .setDescription('```❌ اذكر الشخص```')
                .setColor(0xFF0000);
            return message.reply({ embeds: [embed] });
        }
        db.unbanUser(target.id, message.guild.id);
        const embed = new EmbedBuilder()
            .setTitle('```✅ تم فك الحظر```')
            .setDescription(`> تم فك الحظر عن ${target}`)
            .setColor(0x00FF00)
            .setTimestamp();
        await message.reply({ embeds: [embed] });
        return true;
    }

    if (content === '-افضل' || content === '-top') {
        await sendTopShops(message, settings);
        return true;
    }

    if (content === '-مساعده' || content === '-help') {
        await sendHelpPanel(message, settings);
        return true;
    }

    return false;
}

async function sendBotPanel(message, settings) {
    const embed = new EmbedBuilder()
        .setTitle(`\`\`\`${settings.shopLogo || 'AS'} │ قائمة البوت\`\`\``)
        .setDescription('╭─────────────────────╮\n│     **اختر من القائمة**     │\n╰─────────────────────╯')
        .setColor(0x5865F2)
        .setThumbnail(message.guild.iconURL({ size: 256 }))
        .addFields(
            { name: '🏪 متجري', value: '```عرض معلومات متجرك```', inline: true },
            { name: '📢 منشنات', value: '```شراء منشنات إضافية```', inline: true },
            { name: '🔐 التشفير', value: '```عرض كلمات التشفير```', inline: true },
            { name: '⭐ التقييم', value: '```تقييم المتجر الحالي```', inline: true }
        )
        .setFooter({ text: `✨ ${settings.botName || 'Arab Shop Bot'}`, iconURL: message.client.user.displayAvatarURL() })
        .setTimestamp();

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('panel_shop').setLabel('متجري').setStyle(ButtonStyle.Primary).setEmoji('🏪'),
        new ButtonBuilder().setCustomId('panel_buy').setLabel('منشنات').setStyle(ButtonStyle.Success).setEmoji('📢'),
        new ButtonBuilder().setCustomId('panel_encrypt').setLabel('التشفير').setStyle(ButtonStyle.Secondary).setEmoji('🔐'),
        new ButtonBuilder().setCustomId('panel_rating').setLabel('التقييم').setStyle(ButtonStyle.Danger).setEmoji('⭐')
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel('الموقع').setStyle(ButtonStyle.Link).setURL(config.websiteUrl).setEmoji('🌐'),
        new ButtonBuilder().setLabel('السيرفر').setStyle(ButtonStyle.Link).setURL(config.discordServer).setEmoji('💬')
    );

    await message.channel.send({ embeds: [embed], components: [row1, row2] });
}

async function sendHelpPanel(message, settings) {
    const embed = new EmbedBuilder()
        .setTitle('```📚 قائمة الأوامر```')
        .setDescription('╭─────────────────────╮')
        .setColor(0x5865F2)
        .addFields(
            { name: '🤖 أوامر البوت', value: '> `-بوت` ─ قائمة البوت الرئيسية\n> `-تكت` ─ فتح نظام المتاجر\n> `-تشفير` ─ عرض كلمات التشفير\n> `-افضل` ─ أفضل المتاجر' },
            { name: '👑 أوامر الإدارة', value: '> `-بان @user` ─ حظر من المتاجر\n> `-انبان @user` ─ فك الحظر' },
            { name: '🔗 روابط مهمة', value: `> 🌐 [الموقع](${config.websiteUrl})\n> 💬 [سيرفر الدعم](${config.discordServer})` }
        )
        .setFooter({ text: `✨ ${settings.botName || 'Arab Shop Bot'}` })
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel('الموقع').setStyle(ButtonStyle.Link).setURL(config.websiteUrl).setEmoji('🌐'),
        new ButtonBuilder().setLabel('السيرفر').setStyle(ButtonStyle.Link).setURL(config.discordServer).setEmoji('💬')
    );

    await message.channel.send({ embeds: [embed], components: [row] });
}

async function sendTopShops(message, settings) {
    const topShops = db.getTopShops(message.guild.id, 10);

    let desc = '╭─────────────────────╮\n';
    if (topShops.length === 0) {
        desc += '│   **لا توجد متاجر بعد**   │\n';
    } else {
        topShops.forEach((shop, i) => {
            const avg = shop.rating_count > 0 ? (shop.rating_total / shop.rating_count).toFixed(1) : '0';
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
            const stars = '⭐'.repeat(Math.min(Math.round(parseFloat(avg)), 5));
            desc += `> ${medal} **${shop.logo}** │ ${shop.name} ─ ${stars} \`(${avg})\`\n`;
        });
    }
    desc += '╰─────────────────────╯';

    const embed = new EmbedBuilder()
        .setTitle('```🏆 أفضل المتاجر```')
        .setDescription(desc)
        .setColor(0xFFD700)
        .setThumbnail(message.guild.iconURL({ size: 256 }))
        .setFooter({ text: '✨ التقييمات من العملاء' })
        .setTimestamp();

    await message.channel.send({ embeds: [embed] });
}

async function handleButtonInteraction(interaction) {
    const settings = shopSystem.getSettings(interaction.guild.id);
    const customId = interaction.customId;

    if (customId === 'ticket_shop') {
        const user = db.getUser(interaction.user.id, interaction.guild.id);
        if (user.banned) {
            const embed = new EmbedBuilder()
                .setTitle('```🚫 محظور```')
                .setDescription(`> أنت محظور من إنشاء المتاجر`)
                .addFields({ name: '📝 السبب', value: `\`\`\`${user.ban_reason || 'غير محدد'}\`\`\`` })
                .setColor(0xFF0000);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        await ticketSystem.handleShopPurchase(interaction, settings);
        return;
    }

    if (customId === 'ticket_mentions') {
        await ticketSystem.handleMentionsPurchase(interaction, settings);
        return;
    }

    if (customId === 'ticket_helper') {
        await ticketSystem.handleHelperPurchase(interaction, settings);
        return;
    }

    if (customId === 'panel_shop') {
        const shops = db.getShopsByOwner(interaction.user.id, interaction.guild.id);
        if (shops.length === 0) {
            const embed = new EmbedBuilder()
                .setDescription('```❌ ليس لديك متجر بعد```')
                .setColor(0xFF0000);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        const shop = shops[0];
        const avgRating = shop.rating_count > 0 ? (shop.rating_total / shop.rating_count).toFixed(1) : '0';
        const embed = new EmbedBuilder()
            .setTitle(`\`\`\`${shop.logo} │ ${shop.name}\`\`\``)
            .setDescription('╭─────────────────────╮')
            .setColor(0x3498DB)
            .addFields(
                { name: '📦 النوع', value: `\`${shop.type}\``, inline: true },
                { name: '📁 الفئة', value: `\`${shop.category}\``, inline: true },
                { name: '📢 المنشنات', value: `\`${shop.mentions_left}\` متبقي`, inline: true },
                { name: '⭐ التقييم', value: `\`${avgRating}\` ⭐ (${shop.rating_count} تقييم)`, inline: true }
            )
            .setFooter({ text: '✨ استخدم -بوت لشراء المزيد' })
            .setTimestamp();
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
    }

    if (customId === 'panel_buy') {
        await ticketSystem.handleMentionsPurchase(interaction, settings);
        return;
    }

    if (customId === 'panel_encrypt') {
        await ticketSystem.sendEncryptionButtons(interaction.channel, settings);
        const embed = new EmbedBuilder()
            .setDescription('```✅ تم إرسال قائمة التشفير```')
            .setColor(0x00FF00);
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
    }

    if (customId === 'panel_rating') {
        const shop = db.getShop(interaction.channel.id);
        if (shop) {
            await ticketSystem.sendRatingPanel(interaction.channel, shop.id);
            const embed = new EmbedBuilder()
                .setDescription('```✅ تم إرسال لوحة التقييم```')
                .setColor(0x00FF00);
            await interaction.reply({ embeds: [embed], ephemeral: true });
        } else {
            const embed = new EmbedBuilder()
                .setDescription('```❌ هذه القناة ليست متجر```')
                .setColor(0xFF0000);
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
        return;
    }

    if (customId.startsWith('rate_')) {
        const parts = customId.split('_');
        const rating = parseInt(parts[1]);
        const shopId = parseInt(parts[2]);
        db.addRating(shopId, interaction.user.id, rating);
        const embed = new EmbedBuilder()
            .setTitle('```✅ شكراً لتقييمك!```')
            .setDescription(`> أعطيت **${rating}** ${'⭐'.repeat(rating)}`)
            .setColor(0xF1C40F);
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
    }

    if (customId.startsWith('shop_')) {
        const type = customId.replace('shop_', '');
        const embed = new EmbedBuilder()
            .setDescription(`\`\`\`✅ اخترت نوع: ${type}\`\`\`\n> الآن اختر الفئة من الأزرار`)
            .setColor(0x00FF00);
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
    }

    if (customId.startsWith('cat_')) {
        const catIndex = parseInt(customId.replace('cat_', ''));
        const category = (settings.categories || config.defaultSettings.categories)[catIndex];
        if (category) {
            const embed = new EmbedBuilder()
                .setTitle('```✅ تم اختيار الفئة```')
                .setDescription(`> فئة: **${category.name}**\n> السعر: \`${category.price}\` كريدت`)
                .addFields({ name: '📝 الخطوة التالية', value: '```أرسل اسم متجرك الآن```' })
                .setColor(0x00FF00);
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
        return;
    }

    if (customId.startsWith('buy_')) {
        const amount = parseInt(customId.replace('buy_', '').replace('mention', '').replace('s', ''));
        const totalPrice = amount * (settings.mentionPrice || 500);
        const embed = new EmbedBuilder()
            .setTitle('```💰 إتمام الشراء```')
            .setDescription(`> الكمية: **${amount}** منشن\n> السعر: \`${totalPrice}\` كريدت`)
            .addFields({
                name: '📝 التحويل',
                value: `\`\`\`#credits transfer <@${settings.transferAccount}> ${totalPrice}\`\`\``
            })
            .setColor(0xFFAA00)
            .setFooter({ text: '✨ بعد التحويل اضغط تم' });
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
    }

    if (customId.startsWith('copy_')) {
        const word = customId.replace('copy_', '');
        await interaction.reply({ content: `\`${word}\``, ephemeral: true });
        return;
    }

    if (customId === 'close_ticket') {
        await ticketSystem.closeTicket(interaction.channel);
        return;
    }
}

module.exports = {
    handleCommand,
    handleButtonInteraction,
    sendBotPanel,
    sendTopShops,
    sendHelpPanel
};
