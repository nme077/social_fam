const Post = require('../models/post'),
      User = require('../models/user'),
      Group = require('../models/group'),
      Comment = require('../models/comment'),
      express = require('express'),
      passport = require('passport'),
      middleware = require('../middleware'),
      router = express.Router(),
      nodemailer = require('nodemailer'),
      async = require('async'),
      crypto = require('crypto');

let groupIdToRegister = '';

function removeExpiredTokens(group) {
    const currentTime = Date.now();

    group.newUsers.forEach(el => {
        if(currentTime > el.newUserTokenExpires) {
            group.newUsers.pull(el._id);
            group.save();
        }
    });
}

router.use((req, res, next) => {
    ssn = req.session;

    res.locals.currentUser = req.user;
    res.locals.currentGroup = ssn.currentGroup;
    res.locals.path = req.path;
    next();
});

// Render register page from invite email
router.get('/register/:groupId/:token', (req, res) => {
    // If the invtie is expired, display a message to contact the admin of the group.
    Group.findById(req.params.groupId, (err, group) => {
        if(err) {
            req.flash('error', 'Group not found');
            return res.redirect('back');
        }
        let valid = false;
        // loop over newUsers array to find a valid token
        removeExpiredTokens(group);
        group.newUsers.forEach(el => {
            // Find if the token exists in the group
            if(el.newUserToken === req.params.token) {
                // Set to current group id
                groupIdToRegister = req.params.groupId;
                valid = true;
                return res.render('register', { groupName: group.name, token: req.params.token, groupId: req.params.groupId});
            } 
        });
        if(!valid) res.send('Invalid or expired');
    })
});

// Register page
router.get('/register', (req, res) => {
    // Pass groupid as blank
    res.render('register', {groupId: '', groupName: '', token: ''});
});

// Register the user
// Handle registration logic for new user and new group
router.post('/register', (req, res) => {
    const userInfo = {
        username: req.body.username,
        email: req.body.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName
    };

    // Register user that was not invited
    User.register(new User(userInfo), req.body.password, (err, user) => {
        if(err) {
            req.flash('error', err.message);
            return res.redirect('back');
        }

        ssn = req.session;
        
        passport.authenticate('local')(req, res, () => {

            // If existingFam is not checked, create a new family
        // Add the current user to the group
            const groupInfo = {
                name: req.body.familyName
            }
            Group.create(groupInfo, async(err, group) => {
                if(err) {
                    console.log('Group not created: ' + err);
                    req.flash('error', 'Something went wrong, try again.');
                    res.redirect('back');
                } else {
                    // Initiate user's array of groups and add to array
                    user.groups = [group];
                    // Save the user
                    user.save().then(() => {
                        ssn.currentGroup = group._id;
                        // Create admin user
                        group.adminUser.id = req.user._id;
                        group.adminUser.username = req.user.username;
                        // Add user to list of users in group 
                        group.users = [user];
                        // Save the new group
                        group.save().then(() => {
                            req.flash('success', `Welcome, ${req.user.firstName}!`);
                            res.redirect('/posts');
                        });
                    });
                }
            })
        });
    });
});

// Register new user joining an existing group
router.post('/register/:token', (req, res) => {
    const userInfo = {
        username: req.body.username,
        email: req.body.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName
    };

    currentTime = Date.now();
    
    Group.findById(groupIdToRegister, (err, group) => {
        let validInvite = false;
        if(err) {
            req.flash('error', 'Error, try again!')
            return res.redirect('back')
        }
        if(group == undefined || group === {}) {
            req.flash('error', 'Group not found')
            return res.redirect('back')
        }
        group.newUsers.forEach(el => {
            // Find if the token exists in the group
            if(el.newUserToken === req.params.token && currentTime < el.newUserTokenExpires) {
                group.newUsers.pull(el._id);
                group.save();
                validInvite = true;
                return;
            }
        });
        if(validInvite) {
            // Re-initialize validInvite
            validInvite = false;

            User.register(new User(userInfo), req.body.password, (err, user) => {
                if(err) {
                    req.flash('error', err.message);
                    return res.redirect('back');
                }
        
                ssn = req.session;
        
                passport.authenticate('local')(req, res, () => {
                    
                ssn.currentGroup = group._id;
                groupIdToRegister = '';
                if(err) {
                    req.flash('error', 'Something went wrong, try again.');
                    res.redirect('back');
                } else {
                    // Initiate user's array of groups and add to array
                    user.groups = [group];
                    user.save().then(() => {
                        group.users.push(user);
                        group.save().then(() => {
                            req.flash('success', `Welcome, ${req.user.firstName}!`);
                            res.redirect('/posts');
                        });
                    });
                };
            });
            });
        } else {
            res.send('Try a new link');
        }
    });
});

// Render login page from invite
router.get('/login/:groupId/:token', (req, res) => {
    // If the invite is expired, display a message to contact the admin of the group.
    const currentTime = Date.now();
    Group.findById(req.params.groupId, (err, group) => {
        let valid = false;
        if(err) {
            req.flash('error', 'Something went wrong, try again.')
            return res.redirect('back')
        }
        if(group == undefined || group === {}) {
            req.flash('error', 'Group not found, try again.')
            return res.redirect('back')
        }
        // loop over newUsers array to find a valid token
        group.newUsers.forEach(el => {
            // Find if the token exists in the group
            if(el.newUserToken === req.params.token && currentTime < el.newUserTokenExpires) {
                // Set to current group id
                groupIdToRegister = req.params.groupId;
                valid = true;
                return res.render('login', { groupName: group.name,groupId: req.params.groupId, token: req.params.token });
            }
        });
        if(!valid) res.send('Invalid or expired');
    })
});

// Login page
router.get('/login', (req, res) => {
    res.render('login', { groupName: '', token: '' });
});

// Handle login and join existing group
router.post('/login/:groupId/:token', passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: true
}), (req, res) => {
    //if(req.session.returnTo) {
    //    return res.redirect(req.session.returnTo);
    //}
    const currentTime = Date.now();
    Group.findById(req.params.groupId, (err, group) => {
        let valid = false;
        if(err) {
            req.flash('error', 'Something went wrong, try again.')
            return res.redirect('back')
        }
        if(group == undefined || group === {}) {
            req.flash('error', 'Group not found, try again.')
            return res.redirect('back')
        }
        // loop over newUsers array to find a valid token
        group.newUsers.forEach(el => {
            // Find if the token exists in the group
            if(el.newUserToken === req.params.token && currentTime < el.newUserTokenExpires) {
                // Set to current group id
                groupIdToRegister = req.params.groupId;
                valid = true;
                return groupIdToRegister;
            }
        });
        // Don't continue if the link is invalid
        if(!valid) return res.send('Invalid or expired');

        // Register to group
        ssn = req.session;
        ssn.currentGroup = group._id;
        groupIdToRegister = '';
        if(err) {
            req.flash('error', 'Something went wrong, try again.');
            res.redirect('back');
        } else {
            // Add group to user's list of groups
            User.findById(req.user._id, (err, user) => {
                if(err) {
                    req.flash('error', 'Something went wrong, try again.');
                    return res.redirect('back');
                }
                user.groups.push(group);
                // Save the user, then push the user to the group's array
                user.save().then(() => {
                    group.users.push(user);
                    group.save().then(() => {
                        req.flash('success', `Welcome, ${req.user.firstName}!`);
                        res.redirect('/posts');
                    });
                });
            })
        };
    });
}); 

// Handle login
router.post('/login', passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: true
}), (req, res) => {
    //if(req.session.returnTo) {
    //    return res.redirect(req.session.returnTo);
    //}
    res.redirect('/select_group');
}); 

// Render the page to select a group during login
router.get('/select_group',middleware.isLoggedIn, (req, res) => {
    // If user navigates away, log them out and display 'login canceled'
    Group.find({'_id': { $in: req.user.groups}}, (err, groupArr) => {
        if(err) {
            req.flash('error', 'Something went wrong, try again.');
            res.redirect('back');
        }
        res.render('groupSelect', {groupArr});
    })
});

// Finish login after selecting group to login to
router.post('/select_group',middleware.isLoggedIn, (req, res) => {
    // Assign the current group to the session
    ssn = req.session;
    // Set the current group for the session
    ssn.currentGroup = req.body.groupSelect;

    req.flash('success', 'Successfully logged in. Welcome!')
    res.redirect('/posts');
});

// Logout
router.post('/logout', (req, res) => {
    // Initialize session
    ssn = req.session;
    ssn.currentGroup = '';
    req.logout();
    req.flash('success','You have logged out!')
    res.redirect('/login')
});

// Render all posts
router.get('/posts', middleware.isLoggedIn, middleware.hasGroup, (req, res) => {
    const ssn = req.session;
    const currentGroup = ssn.currentGroup;

    Post.find({group: currentGroup}).populate('comments').exec((err, posts) => {
        const sortedPosts = posts.sort((a,b) => { return a.datePosted < b.datePosted ? 1 : -1 });

        if(err) {
            req.flash('error', 'Sonething went wrong, try again.');
            res.redirect('back');
        } else {
            Group.findById(currentGroup, (err, group) => {
                if(err) {
                    req.flash('error', 'Sonething went wrong, try again.');
                    res.redirect('back');
                }
                res.render('index', {posts: sortedPosts, groupName: group.name});
            })
        }
    });
});

// Add a new post
router.post('/posts', middleware.isLoggedIn, (req, res) => {
    ssn = req.session;
    const currentGroup = ssn.currentGroup;

    Post.create(req.body.post, (err, post) => {
        const user = 'User Test';

        if(err) {
            req.flash('error', 'Sonething went wrong, try again.');
            res.redirect('back');
        } else {
            post.datePosted = new Date(),
            post.user.id = req.user._id;
            post.user.username = req.user.username;
            post.group = currentGroup;
            post.save();

            res.redirect('/posts');
        }
    })
});

// Edit a post
router.put('/posts/:id', (req, res) => {
    console.log('hitting the update post route!')
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
            req.flash('error', 'Sonething went wrong, try again.');
            res.redirect('back');
        } else {
            Comment.deleteMany({_id: { $in: postDeleted.comments}}, (err) => {
                if(err) {
                    req.flash('error', 'Sonething went wrong, try again.');
                    res.redirect('back');
                } else {
                    req.flash('success', 'Post deleted!');
                    res.redirect('/posts');
                }
            });
        }
    })
});

router.get('/settings/group', middleware.isLoggedIn, (req, res) => {
    ssn = req.session;
    const currentGroup = ssn.currentGroup;
    User.find({group: currentGroup}, (err, users) => {
        if(err) {
            req.flash('error', 'Sonething went wrong, try again.');
            res.redirect('back');
        } else {
            res.render('groupOptions', {users});
        }
    })
});

router.post('/settings/group/invite', middleware.isLoggedIn, (req, res, next) => {
    // create a unique id to send invite to a user
    // Store the id in object

    // User signing up must use the same email 
    let groupToJoin = '';

    async.waterfall([
        function(done) {
            crypto.randomBytes(20, (err, buf) => {
                const token = buf.toString('hex');
                done(err, token);
            });
        },
        function(token, done) {
            ssn = req.session;
             
            Group.findById(ssn.currentGroup, (err, group) => {
                if(err) {
                    console.log(err);
                    req.flash('error', 'Sonething went wrong, try again.');
                    return res.redirect('back');
                }
                groupToJoin = group._id;

                const newUserInfo = {
                    newUserToken: token,
                    newUserTokenExpires: Date.now() + 86400000, // 24 hours
                    newUserEmail: req.body.email
                }
    
                if(group.newUsers !== undefined && group.newUsers.length > 0) {
                    group.newUsers.push(newUserInfo);
                } else {
                    group.newUsers = [newUserInfo];
                }
    
                group.save(err => {
                    done(err, token, group)
                });
            })
        },
        function(token, group, done) {
            const smtpTransport = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: 'cardapp77@gmail.com',
                    pass: process.env.GMAILPW
                }
            });
            const mailOptions = {
                to: req.body.email,
                from: '"Cards" <cardapp77@gmail.com>',
                subject: `${res.locals.appName} Invite`,
                text: `Hello, \n\n You have been invited to join ${res.locals.appName}! \n\n Please click the following link or copy and paste it into your browser to join. https://${req.headers.host}/register/${groupToJoin}/${token} \n\n Sincerely, \n Nicholas`,
                html: `
                <h3>Hello,</h3>

                <p>You have been invited to join ${res.locals.appName}! Please click button below or copy and paste the link into your browser to join.</p>
                
                <button style="background: #3492eb; border-color: #3492eb; border-radius: 5px;"><a href="https://${req.headers.host}/register/${groupToJoin}/${token}" style="color: black; text-decoration: none;">Register and join</a></button>

                <p>Sincerely,</p> 
                <p>Nicholas</p>`
            };
            smtpTransport.sendMail(mailOptions, (err) => {
                if(err) {
                    req.flash('error', 'Something went wrong, try again');
                    return done(err, 'done');
                }
                req.flash('success', `An email has been sent to ${req.body.email} with further instructions to join your Fam.`);
                done(err, 'done');
            });
        }
    ], function(err) {
        if(err) return next(err);
        res.redirect('/settings/group');
    });
});

router.get('*', (req, res) => {
    res.redirect('/login');
});

module.exports = router;