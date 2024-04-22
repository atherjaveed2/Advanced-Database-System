const express = require('express');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');

const router = express.Router();

passport.use(
  new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
     
      const user = await User.findOne({ email });
     
      if (!user) {
        return done(null, false);
      }

      const isValidPassword = await user.verifyPassword(password);
     
      if (!isValidPassword) {
        return done(null, false);
      }
    
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});
// Registration page
router.get('/register', (req, res) => {
  res.render('register');
});


// Your route to handle authentication
router.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/auth/login',
}));

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, country, phoneNumber, role } = req.body;

    // Validate the role here to ensure it's one of the allowed roles ('recruiter', 'admin', 'candidate')
    if (!['recruiter', 'admin', 'candidate'].includes(role)) {
      return res.render('error', { errorMessage: 'Invalid role specified' });
    }

    const user = new User({ name, email, password, country, phoneNumber, role });

    await user.save();
    res.redirect('/auth/login');
  } catch (error) {
    next(error);
  }
});

router.get('/login', (req, res) => {
  res.render('login');
});

router.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/auth/login',
}), (req, res) => {
  // This function will be executed when the login is successful
  console.log("Hemanth executed");
  res.json({ success: true, message: 'Login successful' });
});
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      // Handle error, if any
      console.error(err);
    }
    res.redirect('/auth/login');
  });
});


module.exports = router;
