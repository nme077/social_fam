const User = require('../models/user'),
      Post = require('../models/post'),
      Group = require('../models/group'),
      Comment = require('../models/comment'),
      Photo = require('../models/photo'),
      Like = require('../models/like'),
      express = require('express'),
      middleware = require('../middleware'),
      router = express.Router(),
      multer = require('multer'),
      cloudinary = require('cloudinary').v2;

router.use((req, res, next) => {
    ssn = req.session;

    res.locals.currentUser = req.user;
    res.locals.currentGroup = ssn.currentGroup;
    res.locals.path = req.path;
    next();
});

// Multer file limits
const limits = {
    fileSize: 10240 * 10240, // 10 MB (max file size)
    };

// Set up multer
const upload = multer({ 
    limits: limits,
    storage: multer.diskStorage({})
});

// Render all posts
router.get('/posts', middleware.isLoggedIn, middleware.hasGroup, (req, res) => {
    const ssn = req.session;
    const currentGroup = ssn.currentGroup;
    const currentGroupName = ssn.currentGroupName;

    Post.find({group: currentGroup}).populate({path: 'user', populate: {path: 'profilePhoto'}}).populate({path: 'likes', populate: {path: 'author'}}).populate({path: 'comments', populate: {path: 'author'}}).populate('photo').exec((err, posts) => {
        if(err) {
            req.flash('error', 'Something went wrong, try again.');
            res.redirect('back');
        } else {
            const sortedPosts = posts.sort((a,b) => { return a.datePosted < b.datePosted ? 1 : -1 });
            
            res.render('index', {posts: sortedPosts, groupName: currentGroupName});
        }
    });
});


// Add a new post
router.post('/posts', middleware.isLoggedIn, upload.any(), (req, res) => {
    ssn = req.session;
    const currentGroup = ssn.currentGroup;
    const postBody = {
        text: req.body.postText
    }

    Post.create(postBody, (err, post) => {
        if(err) {
            req.flash('error', 'Something went wrong, try again.');
            res.redirect('back');
        } else {
            // If contains photo, upload to cloudinary, store to db, store reference in post
            if(req.files.length > 0) {
                // Upload to cloudinary
                cloudinary.uploader.upload(req.files[0].path, {folder: '/famsocial'}, function(err, result) {
                    if(err) {
                        if(err.message.includes('File size too large')) {
                            req.flash('error', 'File too large, must be less than 10MB.')
                            return res.redirect('back');
                        }
                        req.flash('error', 'Something went wrong, try again.')
                        return res.redirect('back');
                    }
                    
                    const fileToSave = {
                        url: result.url,
                        secure_url: result.secure_url,
                        public_id: result.public_id,
                        user: {
                            id: req.user._id,
                            username: req.user.username
                        },
                        profile: false
                    }
                    // 2. Create the file info in the db
                    Photo.create(fileToSave, (err, uploadedPhoto) => {
                        if(err) {
                            req.flash('error', 'Something went wrong, try again.');
                            res.redirect('back');
                        } else {
                            User.findById(req.user._id, (err, user) => {
                                if(err) {
                                    req.flash('error', 'Something went wrong, try again.');
                                    res.redirect('back');
                                } else {
                                    post.datePosted = new Date();
                                    post.user = req.user._id;
                                    post.group = currentGroup;
                                    post.photo = uploadedPhoto._id;
                                    post.save().then(() => {
                                        return res.redirect('/posts');
                                    });
                                    return;
                                    // Otherwise, reload the page
                                }
                            })
                        }
                    })
                });
            } else {
                post.datePosted = new Date();
                post.user = req.user._id;
                post.group = currentGroup;
                post.save();
                // Otherwise, reload the page
                res.redirect('/posts');
            }
        }
    })
});

// Edit a post
router.put('/posts/:id', (req, res) => {
    const postInfo = {
        text: req.body.post.textNew
    }
    Post.findOneAndUpdate({_id: req.params.id}, postInfo, (err, post) => {
        if(err) {
            req.flash('error', 'Something went wrong');
            res.redirect('back');
        } else {
            req.flash('success', 'Post saved');
            res.redirect('back');
        }
    });
});

// Delete one post
router.delete('/posts/:id', middleware.isLoggedIn, (req, res) => {
    Post.findByIdAndDelete(req.params.id, (err, postDeleted) => {
        if(err) {
            req.flash('error', 'Error deleting post, try again!');
            res.redirect('back');
        } else {
            Comment.deleteMany({_id: { $in: postDeleted.comments}}, (err) => {
                if(err) {
                    req.flash('error', 'Error deleting comments on post, try again!');
                    res.redirect('back');
                } else {
                    Like.deleteMany({_id: { $in: postDeleted.likes}}, (err) => {
                        if(err) {
                            req.flash('error', 'Error deleting likes on post, try again!');
                            res.redirect('back');
                        } else {
                            if(postDeleted.photo) {
                                Photo.findByIdAndDelete(postDeleted.photo._id, (err, deletedPhoto) => {
                                    if(err) {
                                        req.flash('error', 'Error deleting photo in post, try again!');
                                        res.redirect('back');
                                    } else {
                                        // 3. Delete the photo from cloudinary
                                        if(postDeleted.user._id.equals(req.user._id)) {
                                            deletePhoto(req, res, deletedPhoto.public_id);
                                            req.flash('success', 'Post deleted!');
                                            res.redirect('/posts');
                                        } else {
                                            req.flash('error', 'You are not authorized to delete the photo on this post');
                                            res.redirect('back');
                                        }
                                    }
                                })
                            } else {
                                req.flash('success', 'Post deleted!');
                                res.redirect('/posts');
                            }
                        }
                    })
                }
            });
        }
    })
});

function deletePhoto(req,res,publicId) {
    // Delete from server
    cloudinary.uploader.destroy(publicId, (err, result) => {
        if(err) {
            req.flash('error', 'Error deleting photo from server, try again!');
            return res.redirect('back');
        }
     });
}

// Add fist bump to a post
router.post('/posts/:id/like', middleware.isLoggedIn, (req, res) => {

    Post.findById(req.params.id).populate({path: 'likes', populate: {path: 'author'}}).exec((err, post) => {
        if(err) {
            req.flash('error', 'Error. This post will not live long and prosper yet. Try again.');
            res.redirect('back');
        } else {
            if(post.likes && post.likes.length > 0) {
                // Check if user already fist bumped this post
                var alreadyLiked = false
                for(let i = 0; i < post.likes.length; i++) {
                    like = post.likes[i];
                    if(like.author._id.equals(req.user._id)) {
                        alreadyLiked = true;
                        // Remove like
                        Like.findByIdAndDelete(like._id, function(err, deletedLike) {
                            if(err) {
                                return res.redirect('back');
                            } else {
                                return res.redirect('back');
                            }
                        })
                    }
                };
                if(!alreadyLiked) {
                    toggleLike(req, res, post);
                }
            } else {
                toggleLike(req, res, post);
            }
        }
    });
});

function toggleLike(req, res, post) {
    const authorInfo = {
        author: req.user._id
    };
    Like.create(authorInfo, (err, like) => {
        if(err) {
            req.flash('error', 'Something went wrong');
            res.redirect('back');
        } else {
            post.likes.push(like);
            post.save().then(() => {
                req.flash('success', 'May this post live long and prosper.');
                res.redirect('back');
            });
        }
    })
};

// Render a user's profile
router.get('/user/:id', middleware.isLoggedIn, (req, res) => {
    const ssn = req.session;
    const currentGroup = ssn.currentGroup;

    User.findById(req.params.id).populate('profilePhoto').exec((err, user) => {
        if(err) {
            req.flash('error', 'User not found');
            res.redirect('back');
        } else {
            Post.find({group: currentGroup, user: user._id}).populate({path: 'user', populate: {path: 'profilePhoto'}}).populate({path: 'likes', populate: {path: 'author'}}).populate({path: 'comments', populate: {path: 'author'}}).populate('photo').exec((err, posts) => {
                if(err) {
                    req.flash('error', 'Posts not found');
                    res.redirect('back');
                } else {
                    res.render('publicProfile', {user, posts});
                }
            })
        }
    });
});

module.exports = router;