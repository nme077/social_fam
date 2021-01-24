const express = require("express"),
      bodyParser = require('body-parser'),
      methodOverride = require('method-override'),
      flash = require('connect-flash');

const app = express();

app.use(flash());
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride('_method'));

app.get('/', (req, res) => {
    res.render('index');
})

const port = process.env.PORT || 3000;

app.listen(port, function() {
    console.log('Server is running');
})