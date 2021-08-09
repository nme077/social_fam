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

// CONFIGURE EMAIL
const oAuth2Client = new google.auth.OAuth2(process.env.CLIENT_ID, process.env.CLIENT_SECRET, process.env.REDIRECT_URI);

oAuth2Client.setCredentials({refresh_token: process.env.REFRESH_TOKEN});

router.use((req, res, next) => {
    ssn = req.session;

    res.locals.currentUser = req.user;
    res.locals.currentGroup = ssn.currentGroup;
    res.locals.path = req.path;
    next();
});

// Variables
let inviteLink;

// Show account settings screen
router.get('/settings', middleware.isLoggedIn, (req, res) => {
    ssn = req.session;
    const currentGroup = ssn.currentGroup;
    const currentGroupName = ssn.currentGroupName;

    User.findById(req.user.id).populate('profilePhoto').populate('groups').exec((err, user) => {
        if(err) {
            req.flash('error', 'Something went wrong, try again.');
            res.redirect('back');
        } else {
            res.render('settings', {profilePhoto: user.profilePhoto, inviteLink, groupName: currentGroupName, user});
            // Set invite link to default state
            inviteLink = '';
        }
    });
});

// Send invite to group
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
                    req.flash('error', 'Something went wrong, try again.');
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
        function(token,group,done) {
            oAuth2Client.getAccessToken((err, accessToken) => {
                if (err) {
                    console.log(err)
                    req.flash('error', 'Something went wrong, try again.');
                    return res.redirect('back');
                }
                done(err, token, accessToken)
            });
        },
        function(token, accessToken, done) {
            const smtpTransport = nodemailer.createTransport({
                //service: 'Gmail',
                host: 'smtp.gmail.com',
                port: 465,
                secure: true,
                auth: {
                    type: 'OAuth2',
                    clientId: process.env.CLIENT_ID,
                    clientSecret: process.env.CLIENT_SECRET
                }
            });

            const mailOptions = {
                auth: {
                    user: 'cardapp77@gmail.com',
                    refreshToken: process.env.REFRESH_TOKEN,
                    accessToken: accessToken
                },
                to: req.body.email,
                from: '"FamSocial" <cardapp77@gmail.com>',
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
                    console.log(err)
                    req.flash('error', 'Something went wrong, try again');
                    return done(err, 'done');
                }
                req.flash('success', `An email has been sent to ${req.body.email} with further instructions to join your Fam.`);
                res.redirect('back');
                done(err, 'done');
            });
        }
    ], function(err) {
        if(err) return next(err);
        res.redirect('back');
    });
});

// Generate a link to invite to current group
router.post('/settings/group/invite/generate', middleware.isLoggedIn, (req, res) => {
    let groupToJoin = '';
    let token = '';

    crypto.randomBytes(20, (err, buf) => {
        token = buf.toString('hex');
    });

    ssn = req.session;
        
    Group.findById(ssn.currentGroup, (err, group) => {
        if(err) {
            req.flash('error', 'Something went wrong, try again.');
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

        group.save().then(() => {
            inviteLink = `https://${req.headers.host}/register/${groupToJoin}/${token}`
            req.flash('success', 'Invite link generated');
            res.redirect('back');
        })
    });
});

// Create a new group from settings screen
router.post('/settings/group', middleware.isLoggedIn, (req, res) => {
    const groupInfo = {
        name: req.body.newGroupName,
        adminUser: {
            id: req.user._id,
            username: req.user.username
        },
        users: [req.user]
    }

    Group.create(groupInfo, (err, group) => {
        if(err) {
            console.log('Group not created: ' + err);
            req.flash('error', 'Something went wrong, try again.');
            res.redirect('back');
        } else {
            User.findById(req.user._id, (err, user) => {
                if(err) {
                    req.flash('error', 'Something went wrong, try again.');
                    return res.redirect('back');
                }
                user.groups.push(group);
                // Save the user, then push the user to the group's array
                user.save().then(() => {
                    req.flash('success', `${group.name} created! Logout and log back in to switch Fams.`);
                    res.redirect('back');
                });
            });
        }
    })
});

module.exports = router;