const express = require('express');
const uuid = require('uuid');
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
  done(null, { id: user.id, role: user.role }); // Serialize user ID and role
});

passport.deserializeUser(async (serializedUser, done) => {
  try {
    let User;
    switch (serializedUser.role) {
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
        return done(new Error('Invalid user role'));
    }
    const user = await User.findById(serializedUser.id);
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

    let company_id;
    if (User === Company) {
      company_id = uuid.v4(); // Generate a random UUID
    }

    const user = new User({ name, email, password, country, phoneNumber, role, companyName, company_id });

    await user.save();
    res.redirect('/auth/login');
  } catch (error) {
    next(error);
  }
});


router.get('/login', (req, res) => {
  res.render('login');
});


// router.post('/login', passport.authenticate('local', {
//   successRedirect: '/',
//   failureRedirect: '/auth/login',
// }), (req, res) => {
//   // This function will be executed when the login is successful
//   console.log("Javeed executed");
//   res.json({ success: true, message: 'Login successful' });
// });

router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.render('error', { errorMessage: 'Invalid email or password' });
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      return res.redirect('/');
    });
  })(req, res, next);
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
