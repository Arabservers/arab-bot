module.exports = {
    token: 'YOUR_BOT_TOKEN',
    clientId: '1458432385950552220',
    clientSecret: 'X53gnR-kO8vWIFXZP47sZhUWSTXV7gCv',
    dashboardUrl: 'http://fi10.bot-hosting.net:20818',
    discordServer: 'https://discord.gg/FqCXaAQp',
    websiteUrl: 'http://fi10.bot-hosting.net:20818',
    proBotId: '282859044593598464',
    defaultSettings: {
        botName: 'متجر شوب',
        transferAccount: '',
        encryptionWords: {
            'بيع': 'بي3',
            'شراء': 'شر4ء',
            'سعر': 'سع2',
            'حساب': 'ح5اب'
        },
        warningLimit: 3,
        shopTypes: {
            normal: { mentions: 5, price: 1000 },
            good: { mentions: 15, price: 3000 }
        },
        helperPrice: 2000,
        mentionPrice: 500,
        ratingEnabled: true,
        shopLogo: 'Ar',
        categories: [
            { name: 'عادي', price: 1000 },
            { name: 'مميز', price: 3000 },
            { name: 'احترافي', price: 5000 },
            { name: 'الاساطير', price: 9999 }
        ]
    }
};
