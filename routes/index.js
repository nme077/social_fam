const Post = require('../models/post'),
      User = require('../models/user'),
      Group = require('../models/group'),
      Comment = require('../models/comment'),
      Photo = require('../models/photo'),
      express = require('express'),
      passport = require('passport'),
      middleware = require('../middleware'),
      router = express.Router(),
      nodemailer = require('nodemailer'),
      { google } = require('googleapis'),
      async = require('async'),
      crypto = require('crypto');

// CONFIRGURE EMAIL
const oAuth2Client = new google.auth.OAuth2(process.env.CLIENT_ID, process.env.CLIENT_SECRET, process.env.REDIRECT_URI);

oAuth2Client.setCredentials({refresh_token: process.env.REFRESH_TOKEN});

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
    res.locals.currentGroupName = ssn.currentGroupName;
    res.locals.path = req.path;
    next();
});

// Landing page
router.get('/', (req, res) => {
    res.render('about');
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
        if(!valid) res.render('invalidToken');
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
                        ssn.currentGroupName = group.name;
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
        let groupIdToRemove;
        group.newUsers.forEach(el => {
            // Find if the token exists in the group
            if(el.newUserToken === req.params.token && currentTime < el.newUserTokenExpires) {
                groupIdToRemove = el._id;
                validInvite = true;
                return;
            }
        });
        if(validInvite) {
            User.register(new User(userInfo), req.body.password, (err, user) => {
                if(err) {
                    req.flash('error', err.message);
                    return res.redirect('back');
                }
        
                ssn = req.session;
        
                passport.authenticate('local')(req, res, () => {
                    
                ssn.currentGroup = group._id;
                ssn.currentGroupName = group.name;
                groupIdToRegister = '';
                if(err) {
                    req.flash('error', 'Something went wrong, try again.');
                    res.redirect('back');
                } else {
                    // Initiate user's array of groups and add to array
                    user.groups = [group];
                    user.save().then(() => {
                        group.users.push(user);
                        // Re-initialize validInvite
                        validInvite = false;
                        // Remove the token
                        group.newUsers.pull(groupIdToRemove);
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
        if(!valid) res.render('invalidToken');
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
        let groupIdToRemove;
        // loop over newUsers array to find a valid token
        group.newUsers.forEach(el => {
            // Find if the token exists in the group
            if(el.newUserToken === req.params.token && currentTime < el.newUserTokenExpires) {
                // Set to current group id
                groupIdToRegister = req.params.groupId;
                groupIdToRemove = el._id;
                valid = true;
                return groupIdToRegister;
            }
        });
        // Don't continue if the link is invalid
        if(!valid) return res.render('invalidToken');

        // Register to group
        ssn = req.session;
        ssn.currentGroup = group._id;
        ssn.currentGroupName = group.name;
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
                    // Remove the token
                    group.newUsers.pull(groupIdToRemove);

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
    Group.findById(req.body.groupSelect, (err, group) => {
        ssn.currentGroupName = group.name;
        req.flash('success', 'Successfully logged in. Welcome!')
        res.redirect('/posts');
    })
});

// Update user's name
router.put('/user/:id/fullname', middleware.isLoggedIn, (req, res) => {
    const fullName = {
        firstName: req.body.firstName,
        lastName: req.body.lastName
    }

    User.findByIdAndUpdate(req.params.id, fullName, (err, updatedUser) => {
		if(err) {
			req.flash('error', 'Something went wrong, try again.')
            res.redirect('back')
		} else {
            req.flash('success', 'Changes saved.');
			res.redirect('back');
		}
	});
});

// Update email
router.put('/user/:id/email', middleware.isLoggedIn, (req, res) => {
    const email = {
        email: req.body.email
    }

    User.findByIdAndUpdate(req.params.id, email, (err, updatedUser) => {
		if(err) {
			req.flash('error', 'Something went wrong, try again.')
            res.redirect('back')
		} else {
            req.flash('success', 'Changes saved.');
			res.redirect('back');
		}
	});
});

// Reset password
router.post('/reset', middleware.isLoggedIn, (req, res) => {
    async.waterfall([
        function(done) {
            User.findById(req.user._id, (err, user) => {
                if(err) {
                    req.flash('error', 'Error finding user in database');
                    return res.redirect('back');
                }
                if(req.body.newPassword === req.body.confirmPassword) {
                    user.setPassword(req.body.newPassword, (err) => {
                        user.save((err) => {
                            req.logIn(user, (err) => {
                                done(err, user);
                            });
                        });
                    })
                } else {
                    req.flash('error', 'Passwords do not match');
                    res.redirect('back');
                }
            });
        }
        /*,
        function(user, done) {
            const smtpTransport = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: 'cardapp77@gmail.com',
                    pass: process.env.GMAILPW
                }
            });
            const mailOptions = {
                to: user.email,
                from: '"Cards" <cardapp77@gmail.com>',
                subject: 'Your password has been changed',
                text: `Hi ${user.firstName}, \n\n Your Cards password has just changed.`
            };
            smtpTransport.sendMail(mailOptions, (err) => {
                if(err) {
                    req.flash('error', 'Something went wrong, try again');
                    return res.redirect('back');
                }
                req.flash('success', 'Success! Your password has been changed.');
                done(err);
            })
        }*/
    ], function(err) {
        if(err) {
            req.flash('error', 'Something went wrong, try again');
            return res.redirect('back');
        }
        req.flash('success', 'Password changed successfully')
        res.redirect('back');
    })
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

// Landing page
router.get('*', (req, res) => {
    res.render('landing');
});

module.exports = router;