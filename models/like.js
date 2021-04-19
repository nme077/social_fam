const mongoose = require('mongoose');

const likeSchema = mongoose.Schema({
	author: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User"
	}
});


module.exports = mongoose.model('Like', likeSchema);