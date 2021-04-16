const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
    email: {type: String, required: true},
	username: {type: String, unique: true, required: true},
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
    }
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);