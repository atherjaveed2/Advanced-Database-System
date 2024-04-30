const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Define Base Schema
const baseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['recruiter', 'admin', 'jobseeker', 'company'],
    default: 'JobseekerSchema' // You can set the default role as needed
  },
  // Other fields common to all roles
});

// Define Company Schema
const companySchema = new mongoose.Schema({
  company_id: {
    type: String,
    required: true
  },
  companyName: {
    type: String
  },
  adminApprovalStatus: {
    type: Boolean,
    default: false, // Default value for adminApprovalStatus
  },
  // Fields specific to company
});


// Hash password before saving to the database for Company schema
companySchema.pre('save', async function (next) {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

// Verify password for Company schema
companySchema.methods.verifyPassword = async function (password) {
  try {
    return await bcrypt.compare(password, this.password);
    
  } catch (error) {
    throw error;
  }
};

// Define Recruiter Schema
const recruiterSchema = new mongoose.Schema({
  // Field specific to recruiter
  skills: {
    type: [String] // Store skills as a single string
  },
  recruiter_id: {
    type: String,
    required: true,
    unique: true
  },
});


// Hash password before saving to the database for Recruiter schema
recruiterSchema.pre('save', async function (next) {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

// Verify password for Recruiter schema
recruiterSchema.methods.verifyPassword = async function (password) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    throw error;
  }
};

// Define Admin Schema
const adminSchema = new mongoose.Schema({
  // Fields specific to admin
});

// Hash password before saving to the database for Admin schema
adminSchema.pre('save', async function (next) {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

// Verify password for Admin schema
adminSchema.methods.verifyPassword = async function (password) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    throw error;
  }
};


// Define Jobseeker Schema
const JobseekerSchema = new mongoose.Schema({
  // Fields specific to Jobseeker
  resume: {
    type: String,
  },
  jobseeker_id: {
    type: String,
  },
});

// Hash password before saving to the database for Jobseeker schema
JobseekerSchema.pre('save', async function (next) {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

// Verify password for Jobseeker schema
JobseekerSchema.methods.verifyPassword = async function (password) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    throw error;
  }
};


// Apply base schema to all schemas
const applyBaseSchema = (schema) => {
  schema.add(baseSchema);
};

// Apply base schema to all schemas
applyBaseSchema(companySchema);
applyBaseSchema(recruiterSchema);
applyBaseSchema(adminSchema);
applyBaseSchema(JobseekerSchema);

// Define models
const Company = mongoose.model('Company', companySchema);
const Recruiter = mongoose.model('Recruiter', recruiterSchema);
const Admin = mongoose.model('Admin', adminSchema);
const Jobseeker = mongoose.model('Jobseeker', JobseekerSchema);

module.exports = { Company, Recruiter, Admin, Jobseeker };



