const express = require('express');
const router = express.Router();
const path= require('path');
const fs=require('fs');
const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/User');
const contact = require('../models/contact');
const flash = require('connect-flash');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const JobPosting = require('../models/JobPosting'); // Import your JobPosting model here
const mongoose = require('mongoose');
const Application = require('../models/application');
const Company = require('../models/User').Company;
const uuid = require('uuid');



const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/auth/login');
  }


router.get('/', ensureAuthenticated,(req, res) => {
    res.render('landing',{user : req.user});
  });

  router.get('/contact', (req, res) => {
    res.render('contact');
  });

  router.get('/about', (req, res) => {
    res.redirect('/');
  });

  // router.get('/job-postings', async (req, res) => {
  //   try {
  //     const jobPostings = await JobPosting.find({}).exec();
  //     res.render('jobpostings', { jobPostings, user: req.user }); 
  //   } catch (err) {
  //     console.error(err);
  //     res.render('error', { errorMessage: 'An error occurred while fetching job postings.' });
  //   }
  // });

  router.get('/job-posting-form', (req, res) => {
  res.render('jobPostForm',{user : req.user}); 
 });

// Server-side route to render pending companies page
router.get('/pending-companies', async (req, res) => {
  try {
      // Find companies with adminApprovalStatus set to false
      const pendingCompanies = await Company.find({ adminApprovalStatus: false });
      res.render('pending-companies', { companies: pendingCompanies });
  } catch (error) {
      console.error('Error retrieving pending companies:', error);
      res.status(500).send('Internal Server Error');
  }
});


router.get('/viewapplications/:jobId', async (req, res) => {
  try {
    const jobId = req.params.jobId;
    // Find applications related to the specified job ID
    const viewApplications = await Application.find({ job_id: jobId }).populate("jobseeker_id");
    res.render('viewapplications', { applications: viewApplications, jobId:jobId});
  } catch (error) {
    console.error('Error retrieving view applications:', error);
    res.status(500).send('Internal Server Errors');
  }
});


// Endpoint to handle company approval
router.post('/approve-company/:companyId', async (req, res) => {
  const companyId = req.params.companyId;

  try {
    // Update company's adminApprovalStatus to true
    const updatedCompany = await Company.findOneAndUpdate(
      { company_id: companyId },
      { adminApprovalStatus: true },
      { new: true } // To return the updated document
    );

    if (!updatedCompany) {
      console.error('Company not found:', companyId);
      return res.status(404).send('Company not found');
    }

    console.log('Company approved:', updatedCompany);
    res.redirect('/pending-companies');
  } catch (error) {
    console.error('Error approving company:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Define a route to get all recruiters
router.get('/recruiters', async (req, res) => {
  try {
    // Assuming you have a Recruiter model
    const recruiters = await User.Recruiter.find();
    console.log(recruiters, "jabillliiiii")
    res.json(recruiters);
    // res.render('jobPostForm', {user : [],'recruiters':recruiters }); // Render the 'recruiters.ejs' template and pass the recruiters data to it
  } catch (error) {
    console.error('Error retrieving recruiters:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

 
// Handle the job posting upload
router.post('/job-postings', async (req, res) => {
  console.log("heroooooo")
  const { title, description, company, salary, location, requirements, recruiterList} = req.body;

  // Check if the user is authenticated
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const jobPosting = new JobPosting({
      title,
      description,
      company: company,
      company_id: req.user.company_id,
      recruiter_id: req.body.recruiterId,
      job_id: uuid.v4(),
      salary,
      location,
      requirements: requirements.split(',').map(req => req.trim()),
      postedBy: req.user._id,
      recruiterList, 
    });

    console.log(jobPosting, "jobPosting")

    const savedJobPosting = await jobPosting.save();
    res.redirect('/job-postings');
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while uploading the job posting.' });
  }
});


router.post("/shortlist/candidates/", async (req, res) => {
  const selectedApplications = req.body['selectedApplications[]']; // Get the selected application(s)
  const newStatus = "in review"; // Replace with your desired status

  try {
    // Handle single and multiple selections efficiently
    const applicationIds = selectedApplications instanceof Array ? selectedApplications : [selectedApplications]; // Coerce to array if necessary

    const updatedApplications = await Application.updateMany({
      _id: { $in: applicationIds }, // Efficient filtering for all cases
    }, {
      $set: { application_status: newStatus },
    });

    console.log(" Shortlisted applications count:", updatedApplications.modifiedCount);

    if (updatedApplications.modifiedCount === 0) {
      // Informative message for no updates
      return res.json({ message: "No applications were shortlisted." });
    } else {
      // Success message for single or multiple updates
      const message = updatedApplications.modifiedCount === 1
        ? "Application shortlisted successfully!"
        : `${updatedApplications.modifiedCount} applications shortlisted successfully!`;
      return res.json({ message });
    }
  } catch (error) {
    console.error("Error shortlisting applications:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


router.get('/job-posting-form/:id', async (req, res) => {
  const jobId = req.params.id;

  try {
    const jobPosting = await JobPosting.findOne({ _id: jobId }).exec();

    if (jobPosting) {
      res.render('edit-job-form', {user : req.user,jobPosting:jobPosting});
    } else {
      console.log('Job posting not found:', jobId);
      res.status(404).json({ message: 'Job posting not found' });
    }
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


// Route to update a job posting by ID
router.patch('/edit/job-postings/:id', async (req, res) => {
  
  const jobId = req.params.id;

  const {
    title,
    description,
    company,
    salary,
    location,
    requirements
  } = req.body;

  const updatedJobPostingData = {
    title,
    description,
    company: company,
    salary,
    location,
    requirements: requirements.split(',').map(req => req.trim())
  };

  try {
    const updatedJobPosting = await JobPosting.findByIdAndUpdate(
      jobId,
      updatedJobPostingData,
      { new: true }
    ).exec();

    if (!updatedJobPosting) {
      return res.status(404).json({ message: 'Job posting not found' });
    }

    res.redirect('/job-postings');
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/download-resume/:filename', async (req, res) => {
  try {
    const filePath = path.join(__dirname,'..', 'uploads', req.params.filename); // Construct file path

    res.setHeader('Content-Type', 'application/pdf'); // Set appropriate content type
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.filename}"`); // Set download headers

    const fileStream = fs.createReadStream(filePath); // Read file stream
    fileStream.pipe(res); // Stream the file content to the response
    fileStream.on('error', (err) => {
      console.error(err);
      res.status(500).json({ message: 'Error downloading resume' });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving resume' });
  }
});

router.get('/profile/:userId', async (req, res, next) => {
  try {
      const userId = req.params.userId;

      const user = await User.findById(userId);

      if (!user) {
          return res.render('error', { errorMessage: 'User not found.' });
      }

      res.render('profile', { user });
  } catch (error) {
      console.error(error);
      res.render('error', { errorMessage: 'An error occurred while fetching user profile.' });
  }
});

router.delete('/delete/job-posting/:id', async (req, res) => {
  const jobId = req.params.id;

  try {
    // Find the job posting by its ObjectId and remove it
    const result = await JobPosting.deleteOne({ _id: jobId });

    if (result.deletedCount === 1) {
      res.redirect('/job-postings',{user : req.user});
    } else {
      res.status(404).json({ message: 'Job posting not found' });
    }
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});




// Route to render the edit profile form
router.get('/profile/edit/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    const user = await User.findById(userId).exec();

    if (!user) {
      res.render('error', { errorMessage: 'User not found.' });
    } else {
      res.render('editProfile', { user });
    }
  } catch (error) {
    console.error(error);
    res.render('error', { errorMessage: 'An error occurred while fetching user profile.' });
  }
});

// Route to handle the POST request for updating the user's profile
router.post('/profile/edit/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    const user = await User.findByIdAndUpdate(userId, req.body).exec();
    
    if (!user) {
      res.render('error', { errorMessage: 'User not found.' });
    } else {
      res.redirect('/profile/' + userId);
    }
  } catch (error) {
    console.error(error);
    res.render('error', { errorMessage: 'An error occurred while updating user profile.' });
  }
});



// Route to delete a user's profile
router.post('/profile/delete/:userId', (req, res) => {
  const userId = req.params.userId;

  User.findByIdAndRemove(userId, (err) => {
    if (err) {
      console.error(err);
      res.render('error', { errorMessage: 'An error occurred while deleting user profile.' });
    } else {
      // Redirect to a different page or show a confirmation message
      res.redirect('/'); // Redirect to the home page as an example
    }
  });
});

// Route to get a list of job postings
router.get('/job-postings', async (req, res) => {
  try {
    const user = req.user;
    let jobPostings = [];
    if(user.role == "jobseeker"){
        jobPostings = await JobPosting.find();
    }else if(user.role == "recruiter"){
        jobPostings = await JobPosting.find({recruiter_id:user.recruiter_id});
    }else{
      jobPostings = await JobPosting.find({company_id:user.company_id});
    }
    const applications = await Application.find({jobseeker_id:req.user.id});
    console.log(applications," app ");
    res.render('jobpostings', { jobPostings, applications, user: req.user }); 
  } catch (err) {
    console.error(err);
    res.render('error', { errorMessage: 'An error occurred while fetching job postings.' });
  }
});

router.get('/job-posting-form', (req, res) => {
res.render('jobPostForm',{user : req.user}); 
});

router.put('/job-postings/:id', async (req, res) => {
  const jobId = req.params.id;

  try {
    const updatedJobPosting = await JobPosting.findByIdAndUpdate(
      jobId,
      req.body,
      { new: true }
    ).exec();

    if (!updatedJobPosting) {
      return res.status(404).json({ message: 'Job posting not found' });
    }

    res.json(updatedJobPosting);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});



router.get('/explore-users', async (req, res) => {
  try {
    const users = await User.find();
    res.render('explore-users', { users:users,user:req.user });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving users' });
  }
});

// Define a route to display the user edit form
router.get('/edit-user/:userId', async (req, res) => {
  const userId = req.params.userId;
  try {
    const user = await User.findById(userId);
    res.render('edit-user', { user });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving user for edit' });
  }
});

// Define a route to handle user update
router.post('/update-user/:userId', async (req, res) => {
  const userId = req.params.userId;
  const updatedUserData = req.body; // Assuming the form fields have the same names as the User model fields.

  try {
    await User.findByIdAndUpdate(userId, updatedUserData);
    res.redirect('/explore-users');
  } catch (error) {
    res.status(500).json({ message: 'Error updating user' });
  }
});

// Define a route to handle user deletion
router.post('/delete-user/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    await User.findByIdAndRemove(userId);
    res.redirect('/explore-users');
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error deleting user' });
  }
});


router.post('/apply/:jobId', async (req, res) => {
  try {
    // Assuming you have user authentication middleware and userId is available in req.user._id
    const userId = req.user._id; 
    const { jobId } = req.params;

    // Retrieve additional data from request body or wherever available
    const { application_status, placement_status } = req.body;

    // Create a new application instance with the provided data
    const application = new Application({
      job_id: jobId,
      jobseeker_id: userId,
      placement_status: placement_status || 'in progress', // Default to 'pending' if not provided
      application_status: application_status || 'in progress', // Default to 'in progress' if not provided
    });
    // Save the application to the database
    await application.save();
    res.redirect('/job-postings');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while applying for the job posting.' });
  }
});

// Retrieve job applications made by the recruiter
// Assuming you have a "role" field in your user schema, and you set the user's role during authentication
router.get('/applications/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const applications = await Application.find({ job_id: jobId });
    res.render("applications");
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while retrieving job applications.' });
  }
});

router.post('/select/candidate/:jobId', async (req, res) => {
  const { selectedApplication } = req.body; // Assuming selectedApplication ID is sent from the client
  const  jobId= req.params.jobId;
  try {
    // Update all applications to "closed"
    await Application.updateMany({job_id:jobId}, { $set: { application_status: "closed" } });
    await Application.updateMany({job_id:jobId}, { $set: { placement_status: "rejected" } });

    // Update selected application to "placement_status: selected" (assuming it's a separate field)
    if (selectedApplication) {
      await Application.findByIdAndUpdate(selectedApplication, { $set: { placement_status: "selected" } })
    } else {
      console.warn("No selected application ID provided");
    }
    res.redirect("/");
  } catch (error) {
    console.error("Error updating applications:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Retrieve job applications made by the recruiter
// Assuming you have a "role" field in your user schema, and you set the user's role during authentication
router.get('/applications', async (req, res) => {
  try {
    const applications = await Application.find()
    .populate('jobPosting')
    .populate('user');
    res.render('applications',{applications});
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while retrieving job applications.' });
  }
});

module.exports = router;
