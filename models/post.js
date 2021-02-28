const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    user: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        username: String,
        firstName: String,
        lastName: String
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
        }
});


module.exports = mongoose.model('Post', postSchema);