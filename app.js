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
      path = require('path');

// Initialize express
const app = express();

// CONNECT TO MONGODB
mongoose.connect(process.env.URI, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});

// Router routes
const index = require('./routes/index');
const commentRoutes = require('./routes/comments');

// App config
app.use(flash());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
app.use(express.static(path.join(__dirname,'/src')));
app.use(express.static(path.join(__dirname,'/dist')));
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride('_method'));

// Setup passport
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
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.errorMessage = req.flash('error');
	res.locals.successMessage = req.flash('success');
    res.locals.path = req.path;
    res.locals.appName = 'FamSocial';
    next();
});

// Coonfig routes
app.use('/', index);
app.use('/comments', commentRoutes);

const port = process.env.PORT || 3000;

app.listen(port, function() {
    console.log('Server is running');
})