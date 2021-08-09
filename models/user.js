const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const userSchema = new mongoose.Schema({
    email: {type: String, unique: true, required: true},
	username: {type: String, unique: true},
    password: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    firstName: String,
    lastName: String,
    posts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post'
        }
    ],
    groups: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Group'
        }
    ],
    profilePhoto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Image'
    },
    googleId: String
});

userSchema.plugin(passportLocalMongoose, { usernameField : 'email' });
userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);