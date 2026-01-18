'use client';

import { useState, useEffect } from 'react';

export default function ApplicationForm() {
  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    gender: '',
    mobileNumber: '',
    emailAddress: '',
    city: '',
    state: '',
    highestQualification: '',
    specialization: '',
    collegeName: '',
    yearOfPassing: '',
    careerGap: '0',
    roleAppliedFor: '',
    primarySkillSet: '',
    totalExperience: '',
    linkedinUrl: '',
    githubUrl: '',
    availability: '',
    declarationAccepted: false,
  });

  const [files, setFiles] = useState({
    photograph: null,
    resume: null,
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null); // Enhanced error details
  const [successMessage, setSuccessMessage] = useState(null);
  const [healthStatus, setHealthStatus] = useState(null); // Health check status

  // Auto-scroll to top when error or success message changes
  useEffect(() => {
    if (errorMessage || successMessage) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [errorMessage, successMessage]);

  // Check health status when error occurs
  useEffect(() => {
    if (errorDetails && errorDetails.errorCategory === 'AUTHENTICATION') {
      checkHealthStatus();
    }
  }, [errorDetails]);

  // Health check function
  const checkHealthStatus = async () => {
    try {
      console.log('🏥 Checking health status...');
      const response = await fetch('/api/health');
      const data = await response.json();
      setHealthStatus(data);
      console.log('Health status:', data);
    } catch (error) {
      console.error('Health check failed:', error);
    }
  };

  // Initialize error states on component mount
  useEffect(() => {
    // Health check on demand only
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Handle file changes
  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    if (selectedFiles && selectedFiles[0]) {
      setFiles(prev => ({
        ...prev,
        [name]: selectedFiles[0],
      }));
    }
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setErrorDetails(null);
    setSuccessMessage(null);
    setHealthStatus(null);

    console.log('🚀 Form submission started');

    try {
      // Validate files (client-side check)
      console.log('🔍 Validating files...');
      if (!files.photograph || !files.resume) {
        console.log('❌ Validation failed: Missing files');
        setErrorMessage('Please upload both photograph and resume');
        setLoading(false);
        return;
      }

      // Validate declaration
      if (!formData.declarationAccepted) {
        console.log('❌ Validation failed: Declaration not accepted');
        setErrorMessage('Please accept the declaration to continue');
        setLoading(false);
        return;
      }

      console.log('✅ Client-side validation passed');

      // Create FormData for multipart/form-data submission
      const submitData = new FormData();
      
      // Append all form fields
      Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key]);
      });
      
      // Append files
      submitData.append('photograph', files.photograph);
      submitData.append('resume', files.resume);

      // Submit to backend API (Next.js App Router)
      console.log('📤 Submitting application to /api/applications...');
      const response = await fetch('/api/applications', {
        method: 'POST',
        body: submitData,
      });

      const result = await response.json();
      console.log('📥 API Response:', result);

      if (result.success) {
        console.log('✅ Application submitted successfully!');
        console.log('📋 Application ID:', result.applicationId);
        setSuccessMessage('Application submitted successfully! We will get back to you soon.');
        
        // Reset form
        setFormData({
          fullName: '',
          age: '',
          gender: '',
          mobileNumber: '',
          emailAddress: '',
          city: '',
          state: '',
          highestQualification: '',
          specialization: '',
          collegeName: '',
          yearOfPassing: '',
          careerGap: '0',
          roleAppliedFor: '',
          primarySkillSet: '',
          totalExperience: '',
          linkedinUrl: '',
          githubUrl: '',
          availability: '',
          declarationAccepted: false,
        });
        setFiles({ photograph: null, resume: null });
        
        // Reset file inputs
        document.getElementById('photograph').value = '';
        document.getElementById('resume').value = '';
        
      } else {
        console.log('❌ Application submission failed:', result.message);
        console.log('API Response Status:', response.status);
        console.log('Error Type:', result.errorType);
        console.log('Full Response:', result);
        
        // Parse error response and display appropriate message
        let errorMsg = result.message || 'Failed to submit application. Please try again.';
        let detailedErrorMessage = null;

        // Map error types to user-friendly messages and hints
        switch (result.errorType) {
          case 'DATABASE_AUTH':
            errorMsg = '🔐 Database Authentication Failed';
            detailedErrorMessage = (
              <div className="space-y-2">
                <p className="font-semibold">{result.message}</p>
                <p className="text-xs opacity-90">
                  The MongoDB database credentials are incorrect. This is a server configuration issue.
                </p>
                <p className="text-xs opacity-75">
                  <strong>What to do:</strong> {result.hint}
                </p>
              </div>
            );
            break;

          case 'DATABASE_CONNECTION':
            errorMsg = '🌐 Cannot Connect to Database';
            detailedErrorMessage = (
              <div className="space-y-2">
                <p className="font-semibold">{result.message}</p>
                <p className="text-xs opacity-90">
                  The server cannot reach the MongoDB database. Check if the service is running.
                </p>
                <p className="text-xs opacity-75">
                  <strong>What to do:</strong> {result.hint}
                </p>
              </div>
            );
            break;

          case 'DATABASE_WRITE':
            errorMsg = '💾 Failed to Save Application';
            detailedErrorMessage = (
              <div className="space-y-2">
                <p className="font-semibold">{result.message}</p>
                <p className="text-xs opacity-90">
                  Your data was received but could not be saved to the database.
                </p>
                <p className="text-xs opacity-75">
                  <strong>What to do:</strong> {result.hint}
                </p>
              </div>
            );
            break;

          default:
            detailedErrorMessage = (
              <div className="space-y-2">
                <p className="font-semibold">{result.message || 'An error occurred'}</p>
                {result.hint && (
                  <p className="text-xs opacity-75">
                    <strong>Hint:</strong> {result.hint}
                  </p>
                )}
              </div>
            );
        }

        // Store error details for technical section
        setErrorDetails({
          errorType: result.errorType,
          message: result.message,
          location: result.location,
          hint: result.hint,
          timestamp: result.timestamp,
          httpStatus: response.status,
        });

        setErrorMessage(errorMsg);
        
        // Log technical details to console for developers
        if (result.location) {
          console.error(`💡 Error Location: ${result.location}`);
        }
        if (result.hint) {
          console.error(`💡 Hint: ${result.hint}`);
        }
      }
    } catch (error) {
      console.error('❌ Submission error:', error);
      console.error('Error Type:', error.name);
      console.error('Error Message:', error.message);
      
      // Provide helpful suggestions
      if (error.message.includes('Failed to fetch')) {
        console.error('💡 Suggestion: Check if your API server is running (npm run dev)');
      }
      
      setErrorMessage('An error occurred while submitting your application. Please check your internet connection and try again.');
    } finally {
      console.log('🏁 Form submission completed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-appBg py-8 px-4 sm:px-6 lg:px-8 relative">
      {/* Application radial gradient background effect */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-app-radial"></div>
      </div>
      
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Enhanced Error Banner with Diagnostics */}
        {errorMessage && (
          <div
            role="alert"
            className="alert-error mb-6 animate-fade-in"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-base font-semibold text-red-300">
                  Error Occurred
                </h3>
                <p className="mt-1 text-sm">
                  {errorMessage}
                </p>
                
                {/* Enhanced error diagnostics */}
                {errorDetails && (
                  <div className="mt-3 pt-3 border-t border-red-800/30 space-y-3">
                    {/* Error type and classification */}
                    {errorDetails.errorType && (
                      <div className="bg-red-950/20 p-2 rounded text-xs">
                        <div className="font-semibold text-red-200">Error Type:</div>
                        <div className="mt-1 text-red-100/90">
                          {errorDetails.errorType === 'DATABASE_AUTH' && '🔐 Database Authentication Failure'}
                          {errorDetails.errorType === 'DATABASE_CONNECTION' && '🌐 Database Connection Failure'}
                          {errorDetails.errorType === 'DATABASE_WRITE' && '💾 Database Write Operation Failure'}
                          {!['DATABASE_AUTH', 'DATABASE_CONNECTION', 'DATABASE_WRITE'].includes(errorDetails.errorType) && errorDetails.errorType}
                        </div>
                      </div>
                    )}

                    {/* Error location */}
                    {errorDetails.location && (
                      <div className="bg-red-950/20 p-2 rounded text-xs">
                        <div className="font-semibold text-red-200">Location:</div>
                        <div className="mt-1 font-mono text-red-100/75 text-xs">{errorDetails.location}</div>
                      </div>
                    )}

                    {/* Detailed message */}
                    {errorDetails.message && (
                      <div className="bg-red-950/20 p-2 rounded text-xs">
                        <div className="font-semibold text-red-200">Details:</div>
                        <div className="mt-1 text-red-100/90">{errorDetails.message}</div>
                      </div>
                    )}

                    {/* Hint/suggestion */}
                    {errorDetails.hint && (
                      <div className="bg-amber-950/30 p-2 rounded text-xs border-l-2 border-amber-600/50">
                        <div className="font-semibold text-amber-200">💡 What to do:</div>
                        <div className="mt-1 text-amber-100/90">{errorDetails.hint}</div>
                      </div>
                    )}

                    {/* Expandable technical details */}
                    <details className="text-xs">
                      <summary className="cursor-pointer hover:text-red-200 font-medium text-red-200/80">
                        More Technical Details (for developers)
                      </summary>
                      <div className="mt-2 space-y-1 bg-red-950/40 p-2 rounded font-mono text-xs text-red-100/60">
                        {errorDetails.httpStatus && (
                          <div>
                            <span className="text-red-200">HTTP Status:</span> {errorDetails.httpStatus}
                          </div>
                        )}
                        {errorDetails.timestamp && (
                          <div>
                            <span className="text-red-200">Timestamp:</span> {new Date(errorDetails.timestamp).toLocaleString()}
                          </div>
                        )}
                        <div className="mt-1 pt-1 border-t border-red-800/30 opacity-60">
                          Contact support if the error persists
                        </div>
                      </div>
                    </details>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setErrorMessage(null);
                  setErrorDetails(null);
                  setHealthStatus(null);
                }}
                className="ml-3 flex-shrink-0 text-red-400 hover:text-red-300 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Success Banner - Always at Top */}
        {successMessage && (
          <div
            role="status"
            className="alert-success mb-6 animate-fade-in"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-base font-semibold text-green-300">
                  Success!
                </h3>
                <p className="mt-1 text-sm">
                  {successMessage}
                </p>
              </div>
              <button
                onClick={() => setSuccessMessage(null)}
                className="ml-3 flex-shrink-0 text-green-400 hover:text-green-300 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Header - Application Style */}
        <div className="form-card p-8 mb-8 animate-fade-in">
          <h1 className="font-heading text-4xl md:text-5xl mb-3">
            Candidate <span className="gradient-text">Application</span>
          </h1>
          <p className="text-textPrimarySecondary text-lg">
            Please fill out all required fields carefully. Fields marked with <span className="text-accent">*</span> are mandatory.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information - Application Dark Glass Panel */}
          <div className="form-card p-8 mb-8 animate-fade-in">
            <h2 className="section-title">
              Personal Information
            </h2>
            
            <div className="space-y-6">
              {/* Photograph Upload */}
              <div>
                <label htmlFor="photograph" className="block text-sm font-medium text-textPrimary mb-3">
                  Recent Photograph <span className="text-accent">*</span>
                </label>
                <div className="relative">
                  <input
                    type="file"
                    id="photograph"
                    name="photograph"
                    accept="image/*"
                    onChange={handleFileChange}
                    required
                    className="block w-full text-sm text-textPrimary file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-app-gradient file:text-appBg hover:file:shadow-app-glow file:cursor-pointer file:transition-all file:duration-300"
                  />
                  {files.photograph && (
                    <p className="mt-2 text-sm font-medium flex items-center gap-2">
                      <span className="text-accentPrimary">✓</span>
                      <span className="text-textPrimarySecondary">{files.photograph.name}</span>
                    </p>
                  )}
                </div>
                <p className="mt-2 text-xs text-textPrimaryMuted">Max size: 5MB. Formats: JPG, PNG, WEBP</p>
              </div>

              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-textPrimary mb-3">
                  Full Name <span className="text-accent">*</span>
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  maxLength={100}
                  className="form-input"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Age and Gender */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="age" className="block text-sm font-medium text-textPrimary mb-3">
                    Age <span className="text-accent">*</span>
                  </label>
                  <input
                    type="number"
                    id="age"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    required
                    min="18"
                    max="100"
                    className="form-input"
                    placeholder="Enter your age"
                  />
                </div>

                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-textPrimary mb-3">
                    Gender (Optional)
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information - Application Dark Glass Panel */}
          <div className="form-card p-8 mb-8 animate-fade-in">
            <h2 className="section-title">
              Contact Information
            </h2>
            
            <div className="space-y-6">
              {/* Mobile and Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="mobileNumber" className="block text-sm font-medium text-textPrimary mb-3">
                    Mobile Number <span className="text-accent">*</span>
                  </label>
                  <input
                    type="tel"
                    id="mobileNumber"
                    name="mobileNumber"
                    value={formData.mobileNumber}
                    onChange={handleChange}
                    required
                    pattern="[0-9]{10}"
                    className="form-input"
                    placeholder="10-digit mobile number"
                  />
                </div>

                <div>
                  <label htmlFor="emailAddress" className="block text-sm font-medium text-textPrimary mb-3">
                    Email Address <span className="text-accent">*</span>
                  </label>
                  <input
                    type="email"
                    id="emailAddress"
                    name="emailAddress"
                    value={formData.emailAddress}
                    onChange={handleChange}
                    required
                    className="form-input"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              {/* City and State */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-textPrimary mb-3">
                    City <span className="text-accent">*</span>
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="form-input"
                    placeholder="Enter your city"
                  />
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-textPrimary mb-3">
                    State <span className="text-accent">*</span>
                  </label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    className="form-input"
                    placeholder="Enter your state"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Educational Information - Application Dark Glass Panel */}
          <div className="form-card p-8 mb-8 animate-fade-in">
            <h2 className="section-title">
              Educational Information
            </h2>
            
            <div className="space-y-6">
              {/* Qualification and Specialization */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="highestQualification" className="block text-sm font-medium text-textPrimary mb-3">
                    Highest Educational Qualification <span className="text-accent">*</span>
                  </label>
                  <input
                    type="text"
                    id="highestQualification"
                    name="highestQualification"
                    value={formData.highestQualification}
                    onChange={handleChange}
                    required
                    className="form-input"
                    placeholder="e.g., B.Tech, M.Sc, MBA"
                  />
                </div>

                <div>
                  <label htmlFor="specialization" className="block text-sm font-medium text-textPrimary mb-3">
                    Specialization / Stream <span className="text-accent">*</span>
                  </label>
                  <input
                    type="text"
                    id="specialization"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    required
                    className="form-input"
                    placeholder="e.g., Computer Science, Finance"
                  />
                </div>
              </div>

              {/* College Name */}
              <div>
                <label htmlFor="collegeName" className="block text-sm font-medium text-textPrimary mb-3">
                  College / University Name <span className="text-accent">*</span>
                </label>
                <input
                  type="text"
                  id="collegeName"
                  name="collegeName"
                  value={formData.collegeName}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="Enter your college/university name"
                />
              </div>

              {/* Year of Passing and Career Gap */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="yearOfPassing" className="block text-sm font-medium text-textPrimary mb-3">
                    Year of Passing <span className="text-accent">*</span>
                  </label>
                  <input
                    type="number"
                    id="yearOfPassing"
                    name="yearOfPassing"
                    value={formData.yearOfPassing}
                    onChange={handleChange}
                    required
                    min="1950"
                    max={new Date().getFullYear() + 5}
                    className="form-input"
                    placeholder="e.g., 2023"
                  />
                </div>

                <div>
                  <label htmlFor="careerGap" className="block text-sm font-medium text-textPrimary mb-3">
                    Career Gap (if any) - Years
                  </label>
                  <input
                    type="number"
                    id="careerGap"
                    name="careerGap"
                    value={formData.careerGap}
                    onChange={handleChange}
                    min="0"
                    step="0.5"
                    className="form-input"
                    placeholder="Enter in years (e.g., 1.5)"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Professional Information - Application Dark Glass Panel */}
          <div className="form-card p-8 mb-8 animate-fade-in">
            <h2 className="section-title">
              Professional Information
            </h2>
            
            <div className="space-y-6">
              {/* Role Applied For */}
              <div>
                <label htmlFor="roleAppliedFor" className="block text-sm font-medium text-textPrimary mb-3">
                  Role / Position Applied For <span className="text-accent">*</span>
                </label>
                <input
                  type="text"
                  id="roleAppliedFor"
                  name="roleAppliedFor"
                  value={formData.roleAppliedFor}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="e.g., Full Stack Developer, Data Analyst"
                />
              </div>

              {/* Primary Skill Set */}
              <div>
                <label htmlFor="primarySkillSet" className="block text-sm font-medium text-textPrimary mb-3">
                  Primary Skill Set <span className="text-accent">*</span>
                </label>
                <textarea
                  id="primarySkillSet"
                  name="primarySkillSet"
                  value={formData.primarySkillSet}
                  onChange={handleChange}
                  required
                  rows="4"
                  className="form-textarea"
                  placeholder="e.g., React.js, Node.js, MongoDB, AWS, Python"
                />
              </div>

              {/* Total Experience */}
              <div>
                <label htmlFor="totalExperience" className="block text-sm font-medium text-textPrimary mb-3">
                  Total Relevant Experience <span className="text-accent">*</span>
                </label>
                <input
                  type="text"
                  id="totalExperience"
                  name="totalExperience"
                  value={formData.totalExperience}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="e.g., 3 years, Fresher"
                />
              </div>

              {/* LinkedIn and GitHub */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="linkedinUrl" className="block text-sm font-medium text-textPrimary mb-3">
                    LinkedIn Profile URL
                  </label>
                  <input
                    type="url"
                    id="linkedinUrl"
                    name="linkedinUrl"
                    value={formData.linkedinUrl}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>

                <div>
                  <label htmlFor="githubUrl" className="block text-sm font-medium text-textPrimary mb-3">
                    GitHub / Portfolio URL
                  </label>
                  <input
                    type="url"
                    id="githubUrl"
                    name="githubUrl"
                    value={formData.githubUrl}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="https://github.com/yourusername"
                  />
                </div>
              </div>

              {/* Resume Upload */}
              <div>
                <label htmlFor="resume" className="block text-sm font-medium text-textPrimary mb-3">
                  Resume Upload (PDF only) <span className="text-accent">*</span>
                </label>
                <div className="relative">
                  <input
                    type="file"
                    id="resume"
                    name="resume"
                    accept=".pdf"
                    onChange={handleFileChange}
                    required
                    className="block w-full text-sm text-textPrimary file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-app-gradient file:text-appBg hover:file:shadow-app-glow file:cursor-pointer file:transition-all file:duration-300"
                  />
                  {files.resume && (
                    <p className="mt-2 text-sm font-medium flex items-center gap-2">
                      <span className="text-accentPrimary">✓</span>
                      <span className="text-textPrimarySecondary">{files.resume.name}</span>
                    </p>
                  )}
                </div>
                <p className="mt-2 text-xs text-textPrimaryMuted">Max size: 10MB. PDF format only</p>
              </div>

              {/* Availability */}
              <div>
                <label htmlFor="availability" className="block text-sm font-medium text-textPrimary mb-3">
                  Availability / Notice Period <span className="text-accent">*</span>
                </label>
                <input
                  type="text"
                  id="availability"
                  name="availability"
                  value={formData.availability}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="e.g., Immediate, 30 days, 60 days"
                />
              </div>
            </div>
          </div>

          {/* Declaration & Submit - Application Dark Glass Panel */}
          <div className="form-card p-8 mb-8 animate-fade-in">
            <h2 className="section-title">
              Declaration & Consent
            </h2>
            
            <div className="space-y-6">
              <div className="bg-appBgSecondary border border-zenBorder rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    id="declarationAccepted"
                    name="declarationAccepted"
                    checked={formData.declarationAccepted}
                    onChange={handleChange}
                    required
                    className="custom-checkbox mt-1 flex-shrink-0"
                  />
                  <label htmlFor="declarationAccepted" className="text-sm text-textPrimarySecondary leading-relaxed">
                    I hereby declare that all the information provided above is true and correct to the best of my knowledge. 
                    I understand that any false information may result in the rejection of my application or termination of 
                    employment if discovered later. I consent to the processing of my personal data for recruitment purposes. <span className="text-accent font-semibold">*</span>
                  </label>
                </div>
              </div>

              {/* Submit Button - Application Gradient with Glow */}
              <div className="flex justify-center pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className={`btn-primary px-12 py-4 text-lg ${
                    loading 
                      ? 'opacity-50 cursor-not-allowed' 
                      : ''
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center gap-3">
                      <div className="loading-spinner"></div>
                      Submitting Application...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Submit Application
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Footer - Application Style */}
        <div className="mt-8 text-center animate-fade-in">
          <p className="text-sm text-textPrimarySecondary form-card py-4 px-6 inline-block">
            For any queries, please contact us at <span className="text-accent font-semibold">support@company.com</span>
          </p>
        </div>
      </div>
    </div>
  );
}
