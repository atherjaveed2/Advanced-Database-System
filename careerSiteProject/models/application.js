// models/application.js
const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  job_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobPosting',
    required: true,
  },
  jobseeker_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true,
  },
  application_status: {
    type: String,
    enum: ['pending', 'in progress', 'closed'],
    required: true
  },
  placement_status: {
    type: String,
    enum: ['selected', 'rejected',"in progress"],
    required: true
  },
  applicationDate: {
    type: Date,
    default: Date.now,
  },
});

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;
