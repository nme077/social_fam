const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
    user: {
        id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User'
		}, 
		username: String
    },
    url: String,
    secure_url: String,
    public_id: String,
    profile: Boolean
});

module.exports = mongoose.model('Image', photoSchema);