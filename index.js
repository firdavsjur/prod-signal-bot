const { Telegraf, Scenes, session, Markup } = require('telegraf');
const { BaseScene, Stage } = Scenes;
require('dotenv').config();
const User = require('./models/User');
const { v4: uuidv4, validate: uuidValidate } = require('uuid');
const cron = require('node-cron');
const functions = require('./functions/index')
const bot = new Telegraf(process.env.BOT_TOKEN);
require('./connections/index').ConnectMongo()
const startingScene = new BaseScene('startingScene');
const sendSignal = new BaseScene('sendSignal');
const addMember = new BaseScene('addMember');
const registering = new BaseScene('registering');
const checkSubscription = new BaseScene('checkSubscription');



registering.enter(async (ctx) => {
    if (ctx.from.id != process.env.ADMIN_ID) {
        let user = await User.findOne({ telegramId: ctx.from.id });
        if (!user) {
            ctx.reply(
                'Telefon raqamingizni jo\'natish tugmasini bosing: 👇',
                Markup.keyboard([
                    [Markup.button.contactRequest('Raqamni jonatish 📞')]
                ]).oneTime().resize()
            );
        } else {
            ctx.scene.enter('checkSubscription');
        }
    } else {
        ctx.scene.enter('startingScene');
    }
});
registering.on('contact', async (ctx) => {
    await functions.UpsertUserPhoneNumber(ctx)
    ctx.scene.enter('checkSubscription');
});
checkSubscription.enter(async (ctx) => {
    ctx.reply(
        'Obuna bo\'lish tugmasini bosing\nAgar obuna bo\'gan bo\'sangiz Tekshirish tugmasini bosing',
        Markup.inlineKeyboard([
            Markup.button.callback('Obuna bolish ➕', 'joinButton'),
            Markup.button.callback('Tekshirish ✅', 'checksubscription'),
        ])
    );
});
startingScene.enter(async (ctx) => {
    if (ctx.from.id == process.env.ADMIN_ID) {
        ctx.reply('Amaliyotni tanlang: 👇', Markup.keyboard([
            ['Signal yuborish 📩'],
            [`Obunachi qo'shish 👥`]
        ]).oneTime().resize());
    } else {
        ctx.reply('Signal kutilmoqda...😮!', Markup.removeKeyboard());
    }
});

startingScene.on('text', (ctx) => {
    ctx.session.command = ctx.message.text;
    if (ctx.session.command === 'Signal yuborish 📩') {
        ctx.scene.enter('sendSignal');
    } else if (ctx.session.command === `Obunachi qo'shish 👥`) {
        ctx.scene.enter('addMember');
    } else {
        ctx.scene.enter('startingScene');
    }
});
startingScene.on('message', (ctx) => {
    if (ctx.from.id == process.env.ADMIN_ID) {
        ctx.reply('Amaliyotni tanlang: 👇');
    } else {
        ctx.reply('Signal kutilmoqda... 😮');
    }
});


sendSignal.enter((ctx) => ctx.reply('Signalni kiriting 😎: '));
sendSignal.on('text', async (ctx) => {
    ctx.session.signalText = ctx.message.text;
    let users = await functions.GetUsers({ isPrime: true })
    let counter = 0;
    users.forEach(element => {
        if (!uuidValidate(element.telegramId)) {
            functions.IsUserSubscribed(bot, element.telegramId).then(subscribed => {
                if (subscribed){
                    bot.telegram.sendMessage(element.telegramId, ctx.session.signalText)
                    .catch(err => {
                        console.log(err)
                    })
                }
            }).catch(err => {
                console.log(`err: `, err)
            })
            counter++
        }
        
    });
    ctx.reply(`Signal ${counter}ta odamga jo'natildi ✅`);
    ctx.scene.enter('startingScene');
});
sendSignal.on('message', (ctx) => ctx.reply('Signalni xabar korinishida kiriting:'));


addMember.enter((ctx) => ctx.reply('Usernameni kiriting: (masalan: username_fx) 🤪'));
addMember.on('text', async (ctx) => {
    await functions.UpsertUser(ctx)
    ctx.reply('Obunachi muvafaqqiyatli PrimeListga qo\'shildi ✅');
    ctx.scene.enter('startingScene');
});
addMember.on('message', (ctx) => ctx.reply('Usernameni kiriting: (masalan: username_fx) 🤪'));


const stage = new Stage([registering, startingScene, sendSignal, addMember, checkSubscription]);
bot.use(session());
bot.use(stage.middleware());

bot.on('message', (ctx) => {
    const message = ctx.message;
    if (message.text == '/start') {
        ctx.scene.enter('registering')
    } else {
        ctx.reply('Botdan foydalanish uchun /start tugmasini bosing!')
    }
});
bot.launch();
console.log('Bot is running...');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));



bot.action('checksubscription', async (ctx) => {
    const userId = ctx.from.id;
    const isSubscribed = await functions.IsUserSubscribed(bot, userId);
    if (isSubscribed) {
        ctx.reply(`Tabriklaymiz. Siz muvafaqqiyatlil ro\'yxatdan o\'tdingiz! 😊`)
        ctx.scene.enter('startingScene')
    } else {
        ctx.reply('Obuna bo\'lmagansiz! 😡');
    }
});

bot.action('joinButton', async (ctx) => {
    ctx.reply(`Telegram Kanal: @Campus_trade`);
});


