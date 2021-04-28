const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
	name: {type: String, unique: true, required: true},
    adminUser: {
        type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
    },
    users: [
		{
            id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            username: String
        }
    ],
    newUsers: [
        {
            newUserToken: String,
            newUserTokenExpires: String,
            newUserEmail: String
        }
    ]
});

module.exports = mongoose.model('Group', groupSchema);