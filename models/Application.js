import mongoose from 'mongoose';

/**
 * Application Model Schema
 * Stores application form data with Cloudinary URLs for files
 * Database: socialmm_app (local MongoDB)
 */

const ApplicationSchema = new mongoose.Schema(
  {
    // Personal Information
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    photographUrl: {
      type: String,
      required: [true, 'Photograph is required'],
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: [18, 'Minimum age is 18'],
      max: [100, 'Maximum age is 100'],
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', 'Prefer not to say', ''],
      default: '',
    },
    
    // Contact Information
    mobileNumber: {
      type: String,
      required: [true, 'Mobile number is required'],
      match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit mobile number'],
    },
    emailAddress: {
      type: String,
      required: [true, 'Email address is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    
    // Location
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    
    // Educational Information
    highestQualification: {
      type: String,
      required: [true, 'Highest qualification is required'],
      trim: true,
    },
    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      trim: true,
    },
    collegeName: {
      type: String,
      required: [true, 'College/University name is required'],
      trim: true,
    },
    yearOfPassing: {
      type: Number,
      required: [true, 'Year of passing is required'],
      min: [1950, 'Year must be after 1950'],
      max: [new Date().getFullYear() + 5, 'Year cannot be more than 5 years in the future'],
    },
    careerGap: {
      type: Number,
      default: 0,
      min: [0, 'Career gap cannot be negative'],
    },
    
    // Professional Information
    roleAppliedFor: {
      type: String,
      required: [true, 'Role applied for is required'],
      trim: true,
    },
    primarySkillSet: {
      type: String,
      required: [true, 'Primary skill set is required'],
      trim: true,
    },
    totalExperience: {
      type: String,
      required: [true, 'Total experience is required'],
      trim: true,
    },
    
    // Links
    linkedinUrl: {
      type: String,
      trim: true,
      default: '',
    },
    githubUrl: {
      type: String,
      trim: true,
      default: '',
    },
    
    // Resume
    resumeUrl: {
      type: String,
      required: [true, 'Resume is required'],
    },
    
    // Availability
    availability: {
      type: String,
      required: [true, 'Availability/Notice period is required'],
      trim: true,
    },
    
    // Declaration
    declarationAccepted: {
      type: Boolean,
      required: [true, 'Declaration must be accepted'],
      validate: {
        validator: function(v) {
          return v === true;
        },
        message: 'Declaration must be accepted to submit the application',
      },
    },
    
    // Metadata
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'shortlisted', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for efficient querying
ApplicationSchema.index({ emailAddress: 1 }, { unique: true });
ApplicationSchema.index({ submittedAt: -1 });
ApplicationSchema.index({ createdAt: -1 });
ApplicationSchema.index({ status: 1 });
ApplicationSchema.index({ roleAppliedFor: 1 });

// Prevent model recompilation during Next.js hot reload
const Application = mongoose.models.Application || mongoose.model('Application', ApplicationSchema);

export default Application;
