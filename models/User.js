const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    telegramId: { type: String},
    username: { type: String },
    firstName: { type: String },
    lastName: { type: String },
    phoneNumber:{type:String},
    isPrime:{type:Boolean},
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

module.exports = User;