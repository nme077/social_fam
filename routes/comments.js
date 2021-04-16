const express = require('express');
const router = express.Router({mergeParams: true});
var Post = require('../models/post');
var Comment = require('../models/comment');
const middleware = require('../middleware/index.js');

// ====================
// COMMENTS ROUTES
// ====================

// Create new comment
router.post('/', middleware.isLoggedIn, (req, res) => {
	Post.findById(req.params.id, (err, post) => {
		if(err) {
			console.log(err);
			req.flash('error', "Somethng went wrong");
			res.redirect('/posts');
		} else {
			Comment.create({text: req.body.comment}, (err, comment) => {
				if(err) {
					console.log(err);
					req.flash('error', "Somethng went wrong");
					res.redirect('back');
				} else {
					// Add user id and name to comment
					comment.author = req.user._id;
					comment.save().then(() => {
						// Save comment
						post.comments.push(comment);
						post.save();
						req.flash('success', "Comment added");
						res.redirect('/posts');
					});
				}
			})
		}
	})
});

// Edit route
router.get('/:comment_id/edit', middleware.verifyCommentOwnership, (req, res) =>{
	Comment.findById(req.params.comment_id, (err, foundComment) => {
		if(err || !foundComment) {
			req.flash('error', 'Something went wrong');
			res.redirect('back');
		} else {
			res.render('comments/edit', {post_id: req.params.id, comment: foundComment});
		}
	});
});

// Update route
router.put('/:comment_id', middleware.verifyCommentOwnership, (req, res) => {
	Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, (err, updatedComment) => {
		if(err) {
			res.redirect('back');
		} else {
			res.redirect('/posts');
		}
	});
});

// Comments Destroy Route
router.delete('/:comment_id', middleware.verifyCommentOwnership, (req, res) => {
	Comment.findByIdAndRemove(req.params.comment_id, (err, deletedComment) => {
		if(err) {
			res.redirect('back');
		} else {
			req.flash('success', 'Comment deleted!')
			res.redirect('/posts');
		}
	})
});




module.exports = router;