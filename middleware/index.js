var Comment = require('../models/comment');

const middlewareObj = {};

// Logged in middleware
middlewareObj.isLoggedIn = function(req, res, next) {
	if(!req.isAuthenticated()) {
		req.session.returnTo = req.originalUrl;
		req.flash('error', 'You must be logged in to do that.')
		return res.redirect('/login');
	}

	return next();
};

middlewareObj.hasGroup = function(req, res, next) {
	const ssn = req.session;
	const currentGroup = ssn.currentGroup;
	
	if(!currentGroup) {
		const ssn = req.session;
    	ssn.currentGroup = '';
    	req.logout();
		req.session.returnTo = req.originalUrl;
		req.flash('error', 'You must be logged in to do that.')
		return res.redirect('/login');
	}

	return next();
}

middlewareObj.verifyCommentOwnership = function(req, res, next) {
	if(req.isAuthenticated()) {
		Comment.findById(req.params.comment_id, (err, foundComment) => {
			if(err || !foundComment) {
				req.flash('error', "Something went wrong");
				res.redirect('/posts');
			} else {
				if(foundComment.author.id.equals(req.user._id)) {
					next();
				} else {
					req.flash('error', "Permission denied");
					res.redirect('back');
				}
			}
		});	
	} else {
		req.flash('error', "You must be logged in to do that...");
		res.redirect('back');
	}
};

module.exports = middlewareObj;