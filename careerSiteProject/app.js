const express = require('express');
const mongoose = require('mongoose');
const app = express();
const methodOverride = require('method-override');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const bodyParser = require('body-parser');
const multer = require('multer');


// Import routes
const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');

const mangoUrl = "mongodb+srv://javeed:admin@cluster0.zxq7hav.mongodb.net/jobhunt";

// Connect to MongoDB
mongoose.connect(mangoUrl, { useNewUrlParser: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));


// Set up sessions
app.use(session({
    secret: 'CareerSite',
    resave: true,
    saveUninitialized: true
  }));



// Set up middleware
// Initialize Passport and sessions
app.use(flash())
app.use(passport.initialize());
app.use(passport.session());

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(flash());
// Add body parsing middleware
app.use(methodOverride('_method'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());





// Set up view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Set up routes
app.use('/', indexRouter);
app.use('/auth', authRouter);

const port = process.env.PORT || 3001;

// Start the server
app.listen(port, () => console.log('Server started on port 3001'));

