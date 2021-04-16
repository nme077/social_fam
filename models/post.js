const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    datePosted: Date,
    text: String,
    comments: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Comment'
		}
    ],
    group: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Group'
        },
    profilePhoto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Image'
    },
    photo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Image'
    }
});


module.exports = mongoose.model('Post', postSchema);