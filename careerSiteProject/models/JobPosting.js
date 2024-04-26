const mongoose = require('mongoose');

const jobPostingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  company: {
      type: String,
      required: true
  },
  company_id: {
    type: String,
    required: true,
    unique: true
  },
  salary: {
    type: Number,
    required: true
  },
  // Add other details related to the job posting as needed
  location: {
    type: String
  },
  requirements: {
    type: [String] 
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: true
  },
  postedAt: {
    type: Date,
    default: Date.now
  },
  recruiter_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }

});

const JobPosting = mongoose.model('JobPosting', jobPostingSchema);

module.exports = JobPosting;
