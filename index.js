const { Client, GatewayIntentBits, Partials, Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('./config');
const db = require('./database');
const shopSystem = require('./shopSystem');
const ticketSystem = require('./ticketSystem');
const commands = require('./commands');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Message, Partials.Channel]
});

client.once(Events.ClientReady, () => {
    console.log(`Bot is ready! Logged in as ${client.user.tag}`);
    client.user.setActivity('متاجر | -بوت', { type: 3 });
});

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;
    if (!message.guild) return;

    const settings = shopSystem.getSettings(message.guild.id);

    const handled = await commands.handleCommand(message);
    if (handled) return;

    const shop = db.getShop(message.channel.id);
    if (shop) {
        const helpers = JSON.parse(shop.helpers || '[]');
        const canSend = message.author.id === shop.owner_id || helpers.includes(message.author.id);

        if (!canSend) {
            await message.delete().catch(() => { });
            return;
        }

        const encryptCheck = shopSystem.checkEncryption(message.content, settings);
        if (!encryptCheck.valid) {
            const user = db.getUser(message.author.id, message.guild.id);
            const newWarnings = db.addWarning(message.author.id, message.guild.id);

            await message.delete().catch(() => { });

            const warningEmbed = new EmbedBuilder()
                .setTitle('⚠️ تحذير - عدم التشفير')
                .setDescription(`${message.author}، يجب تشفير كلمة **${encryptCheck.word}**\n\nالتحذيرات: ${newWarnings.warnings}/${settings.warningLimit}`)
                .setColor('#ff0000');

            const warningMsg = await message.channel.send({ embeds: [warningEmbed] });
            setTimeout(() => warningMsg.delete().catch(() => { }), 5000);

            if (newWarnings.warnings >= settings.warningLimit) {
                db.banUser(message.author.id, message.guild.id, 'تجاوز حد التحذيرات');
                await message.channel.send({ content: `🚫 ${message.author} تم حظرك من المتاجر بسبب تجاوز حد التحذيرات` });
            }
            return;
        }

        const mentionResult = await shopSystem.handleMention(message, shop, settings);
        if (mentionResult) {
            if (!mentionResult.allowed) {
                await message.delete().catch(() => { });
                const noMentionsEmbed = new EmbedBuilder()
                    .setTitle('❌ نفذت المنشنات')
                    .setDescription(`${message.author}، لا يوجد لديك منشنات متبقية!\n\nاستخدم \`-بوت\` لشراء منشنات إضافية`)
                    .setColor('#ff0000');
                const msg = await message.channel.send({ embeds: [noMentionsEmbed] });
                setTimeout(() => msg.delete().catch(() => { }), 5000);
            } else {
                const remainingEmbed = new EmbedBuilder()
                    .setDescription(`📢 باقي لك **${mentionResult.remaining}** منشن`)
                    .setColor('#00ff00');
                const msg = await message.channel.send({ embeds: [remainingEmbed] });
                setTimeout(() => msg.delete().catch(() => { }), 3000);
            }
        }
    }

    const ticket = db.getTicket(message.channel.id);
    if (ticket && ticket.status === 'open') {
        if (message.mentions.users.size > 0 && ticket.type === 'helper') {
            const helper = message.mentions.users.first();
            const shops = db.getShopsByOwner(message.author.id, message.guild.id);
            if (shops.length > 0) {
                const totalPrice = settings.helperPrice;
                const embed = new EmbedBuilder()
                    .setTitle('👥 إضافة مساعد')
                    .setDescription(`لإضافة ${helper} كمساعد، حوّل **${totalPrice}** كريدت\n\nإلى: <@${settings.transferAccount}>\n\nالأمر: \`#credits transfer <@${settings.transferAccount}> ${totalPrice}\``)
                    .setColor('#9b59b6');

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`confirm_helper_${helper.id}`).setLabel('تم التحويل').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId('close_ticket').setLabel('إغلاق').setStyle(ButtonStyle.Danger)
                );

                await message.channel.send({ embeds: [embed], components: [row] });
            }
        }

        if (!message.content.startsWith('-') && !message.content.startsWith('#') && !message.mentions.users.size) {
            const shopName = message.content.trim();
            if (shopName.length > 0 && shopName.length <= 50) {
                const user = db.getUser(message.author.id, message.guild.id);
                if (user.banned) {
                    return message.reply(`❌ أنت محظور\nالسبب: ${user.ban_reason}`);
                }

                const existingShops = db.getShopsByOwner(message.author.id, message.guild.id);
                if (existingShops.length > 0) {
                    return message.reply('❌ لديك متجر بالفعل');
                }

                const shopType = 'normal';
                const category = settings.categories[0].name;
                const typeInfo = settings.shopTypes[shopType];
                const catPrice = shopSystem.getCategoryPrice(category, settings);
                const totalPrice = typeInfo.price + catPrice;

                const embed = new EmbedBuilder()
                    .setTitle('🏪 تأكيد شراء المتجر')
                    .setDescription(`اسم المتجر: **${shopName}**\nالنوع: **${shopType}**\nالفئة: **${category}**\n\n💰 السعر الإجمالي: **${totalPrice}** كريدت`)
                    .addFields({ name: 'التحويل', value: `حوّل إلى: <@${settings.transferAccount}>\n\n\`#credits transfer <@${settings.transferAccount}> ${totalPrice}\`` })
                    .setColor('#00ff00');

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`confirm_shop_${shopName}_${shopType}_${category}`).setLabel('تم التحويل').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId('close_ticket').setLabel('إلغاء').setStyle(ButtonStyle.Danger)
                );

                await message.channel.send({ embeds: [embed], components: [row] });
            }
        }
    }
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isButton()) return;

    const settings = shopSystem.getSettings(interaction.guild.id);
    const customId = interaction.customId;

    if (customId.startsWith('confirm_shop_')) {
        const parts = customId.replace('confirm_shop_', '').split('_');
        const shopName = parts[0];
        const shopType = parts[1] || 'normal';
        const category = parts[2] || settings.categories[0].name;

        const typeInfo = settings.shopTypes[shopType];
        const catPrice = shopSystem.getCategoryPrice(category, settings);
        const totalPrice = typeInfo.price + catPrice;

        const verified = await shopSystem.verifyProBotTransfer(interaction, totalPrice, settings.transferAccount);

        const channel = await shopSystem.createShopChannel(
            interaction.guild,
            interaction.user,
            { name: shopName, logo: settings.shopLogo, type: shopType, category },
            settings
        );

        db.createShop({
            serverId: interaction.guild.id,
            ownerId: interaction.user.id,
            channelId: channel.id,
            name: shopName,
            logo: settings.shopLogo,
            type: shopType,
            category,
            mentions: typeInfo.mentions
        });

        const successEmbed = new EmbedBuilder()
            .setTitle('✅ تم إنشاء متجرك!')
            .setDescription(`متجرك: ${channel}\n\nالمنشنات: **${typeInfo.mentions}**`)
            .setColor('#00ff00');

        await interaction.reply({ embeds: [successEmbed] });

        const welcomeEmbed = new EmbedBuilder()
            .setTitle(`${settings.shopLogo} | ${shopName}`)
            .setDescription(`مرحباً بك في متجر ${interaction.user}!\n\nاستخدم \`-بوت\` للمساعدة`)
            .setColor('#5865f2');

        await channel.send({ embeds: [welcomeEmbed] });

        if (settings.ratingEnabled) {
            const shop = db.getShop(channel.id);
            await ticketSystem.sendRatingPanel(channel, shop.id);
        }

        await ticketSystem.closeTicket(interaction.channel);
    }

    if (customId.startsWith('confirm_helper_')) {
        const helperId = customId.replace('confirm_helper_', '');
        const shops = db.getShopsByOwner(interaction.user.id, interaction.guild.id);

        if (shops.length > 0) {
            await shopSystem.addHelper(interaction.guild, shops[0], helperId);
            await interaction.reply({ content: `✅ تمت إضافة <@${helperId}> كمساعد في متجرك!` });
            await ticketSystem.closeTicket(interaction.channel);
        }
    }

    await commands.handleButtonInteraction(interaction);
});

client.on(Events.GuildCreate, (guild) => {
    db.getServer(guild.id);
    console.log(`Joined new guild: ${guild.name}`);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

client.login(config.token);
