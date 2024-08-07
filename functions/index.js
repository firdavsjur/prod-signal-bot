const User = require('../models/User');
const { v4: uuidv4,validate: uuidValidate} = require('uuid');
async function IsUserSubscribed(bot,userId) {
    try {
        const chatMember = await bot.telegram.getChatMember('@Campus_trade', userId);
        return chatMember.status === 'member' || chatMember.status === 'administrator' || chatMember.status === 'creator';
    } catch (error) {
        console.error('Error checking subscription status:',error);
        return false;
    }
}

async function UpsertUserPhoneNumber(ctx){
    const contact = ctx.message.contact;
    const phoneNumber = contact.phone_number;
    const telegramId = ctx.from.id.toString();
    const username = ctx.from.username || '';
    const firstName = ctx.from.first_name || '';
    const lastName = ctx.from.last_name || '';

    let user = await User.findOne({ username });
    if (!user) {
        user = new User({ telegramId, username, firstName, lastName, phoneNumber });
        await user.save();
        console.log('New user created:', user);
    } else {
       user.firstName = firstName
       user.lastName = lastName
       user.telegramId = telegramId
       await user.save();
       console.log(`User's Data updated`)
    }
}


async function UpsertUser(ctx){
    let user = await User.findOne({ username: ctx.message.text });
    if (!user) {
        user = new User({ telegramId:uuidv4(),username: ctx.message.text, isPrime: true });
        await user.save();
        console.log('New user created:', user);
    } else {
        user.isPrime = true;
        await user.save();
        console.log('Given Prime Permission', user);
    }
}

async function GetUsers(filter){
    let users = await User.find(filter);
    return users
}

module.exports = {IsUserSubscribed,UpsertUser,GetUsers,UpsertUserPhoneNumber}