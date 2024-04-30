const express = require('express');
const uuid = require('uuid');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { Company, Recruiter, Admin, Jobseeker } = require('../models/User');
const router = express.Router();
const multer = require('multer');
const path=require('path');
const fs=require('fs');


// Set up Multer middleware with disk storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Specify the destination directory
  },
  filename: function (req, file, cb) {
    // Preserve the original filename and extension
    cb(null, file.originalname);
  }
});
const upload = multer({ storage: storage });

// const upload = multer({ dest: 'uploads/' });

passport.use(new LocalStrategy({ usernameField: 'email', passReqToCallback: true }, async (req, email, password, done) => {
  const role = req.body.role; // Extract role from request body

  try {
    let User;
    switch (role.toLowerCase()) {
      case 'company':
        User = Company;
        break;
      case 'recruiter':
        User = Recruiter;
        break;
      case 'admin':
        User = Admin;
        break;
      case 'jobseeker':
        User = Jobseeker;
        break;
      default:
        console.log("Invalid role specified:", role);
        return done(new Error('Invalid role specified'));
    }

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
      case 'jobseeker':
        User = Jobseeker;
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

router.post('/register', upload.single('resume'), async (req, res, next) => {
  try {
    const { name, email, password, country, phoneNumber, role, skills } = req.body;
    
    switch (role.toLowerCase()) {
      case 'admin':
        const admin = new Admin({ name, email, password, country, phoneNumber, role });
        await admin.save();
        break;
      case 'company':
        const { company_name, admin_approval_status } = req.body;
        let company_id = uuid.v4();
        const company = new Company({ name, email, password, country, phoneNumber, role, company_name, admin_approval_status, company_id });
        await company.save();
        break;
      case 'recruiter':
        let recruiter_id = uuid.v4();
        const recruiter = new Recruiter({ name, email, password, country, phoneNumber, role, skills, recruiter_id });
        await recruiter.save();
        break;
      case 'jobseeker':
        const resumePath = req.file.path; // Path to the uploaded resume file
        console.log("Resume uploaded at:", resumePath);
        let jobseeker_id = uuid.v4();
        const jobseeker = new Jobseeker({ name, email, password, country, phoneNumber, role, resume: resumePath, jobseeker_id });
        await jobseeker.save();
        break;
      default:
        return res.render('error', { errorMessage: 'Invalid role specified' });
    }

    res.redirect('/auth/login');
  } catch (error) {
    next(error);
  }
});


router.get('/login', (req, res) => {
  res.render('login');
});

router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error('Error during authentication:', err);
      return next(err);
    }
    if (!user) {
      console.log('User not found');
      return res.render('error', { errorMessage: 'Invalid email or password' });
    }
    req.logIn(user, (err) => {
      if (err) {
        console.error('Error during login:', err);
        return next(err);
      }
      console.log('User logged in successfully:', user);
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
