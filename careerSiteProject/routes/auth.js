const express = require('express');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { Company, Recruiter, Admin, Candidate } = require('../models/User');

const router = express.Router();

passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
  try {
    const user = await Company.findOne({ email }); // Use the appropriate model based on role
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
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await Company.findById(id); // Deserialize based on the role
    done(null, user);
  } catch (error) {
    done(error);
  }
});

router.get('/register', (req, res) => {
  res.render('register');
});

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, country, phoneNumber, role, companyName } = req.body;
    let User; // Define the User variable to hold the appropriate model

    switch (role) {
      case 'recruiter':
        User = Recruiter;
        break;
      case 'admin':
        User = Admin;
        break;
      case 'candidate':
        User = Candidate;
        break;
      case 'company':
        User = Company;
        break;
      default:
        return res.render('error', { errorMessage: 'Invalid role specified' });
    }

    const user = new User({ name, email, password, country, phoneNumber, role, companyName });

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
  console.log("Javeed executed");
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
