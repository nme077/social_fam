const express = require('express'),
      router = express.Router(), 
      passport = require('passport'),
      GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
      User = require('../../models/user')


// Configure Passport - Google strategy
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL
},
(accessToken, refreshToken, profile, done) => {
    User.findOne({googleId: profile.id}, (err, foundUser) => {
        if(err || foundUser) {
            return done(err, foundUser);
        }
        
        const verifiedEmail = profile.emails.find(email => email.verified) || profile.emails[0];

        User.findOne({ email: verifiedEmail.value }, (emailErr, foundUserByEmail) => {
            if(foundUserByEmail) {
                // do not continue if user was authenticated with local strategy
                return done(null, false, 'Please login with email and password, account was originally created with this.');
            }
            const userInfo = {
                firstName: profile.name.givenName,
                lastName: profile.name.familyName,
                email: verifiedEmail.value,
                googleId: profile.id
            };
    
            // pass null password since using Google Auth
            new User(userInfo).save((createdErr, createdUser) => {
                return done(createdErr, createdUser);
            })
        })
  })
}
));

// Login with Google
router.get('/auth/google', passport.authenticate('google', { 
    scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'] 
}));

router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login', failureFlash: true }),
  function(req, res) {
    // If this is a new user, redirect to registration page
        // Here they can upload profile picture and create a "Fam" and create a username
        // Next time they login, redirect to this registration page if they have not yet created or joined a "Fam"
    // If user exists, redirect to '/select_group'
    res.redirect('/select_group');
  }
);

module.exports = router;