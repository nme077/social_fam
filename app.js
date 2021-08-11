const express = require("express"),
      bodyParser = require('body-parser'),
      methodOverride = require('method-override'),
      session = require('express-session'),
      MemoryStore = require('memorystore')(session),
      flash = require('connect-flash'),
      dotenv = require('dotenv').config(),
      mongoose = require('mongoose'),
      mongodb = require('mongodb'),
      passport = require('passport'),
      localStrategy = require('passport-local'),
      passportLocalMongoose = require('passport-local-mongoose'),
      Post = require('./models/post'),
      User = require('./models/user'),
      Photo = require('./models/photo'),
      path = require('path');

// Initialize express
const app = express();

// CONNECT TO MONGODB
mongoose.connect(process.env.URI, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true});

// Router routes
const index = require('./routes/index');
const googleAuthRoutes = require('./routes/authRoutes/googleAuth');
const localAuthRoutes = require('./routes/authRoutes/localAuth');
const commentRoutes = require('./routes/comments');
const postsRoutes = require('./routes/posts');
const settingsRoutes = require('./routes/settings');
const mediaRoutes = require('./routes/photos');

// App config
app.use(flash());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
app.use(express.static(path.join(__dirname,'/src')));
app.use(express.static(path.join(__dirname,'/dist')));
app.use(express.urlencoded({extended: true}));
app.use(methodOverride('_method'));

// Setup session
app.use(session({
    cookie: { maxAge: 86400000 },
    store: new MemoryStore({
        checkPeriod: 86400000 // prune expired entries every 24h
    }),
    secret: 'Def Leppard is the GOAT',
    resave: false,
    saveUninitialized: false,
    credentials: true
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.errorMessage = req.flash('error');
	res.locals.successMessage = req.flash('success');
    res.locals.path = req.path;
    res.locals.appName = 'FamSocial';
    res.locals.currentUser = req.user;
    next();
});

// Config routes
app.use('/', postsRoutes);
app.use('/', settingsRoutes);
app.use('/', mediaRoutes)
app.use('/posts/:id/comments', commentRoutes);
app.use(googleAuthRoutes);
app.use(localAuthRoutes);
app.use('/', index); // Must be last route

app.get('*', (req, res) => {
    res.redirect('/');
});

const port = process.env.PORT || 3000;

app.listen(port, function() {
    console.log('Server is running');
})