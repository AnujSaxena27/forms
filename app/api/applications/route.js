import { NextResponse } from 'next/server';
import connectDB, { createErrorResponse, getHttpStatus } from '../../../lib/mongodb.js';
import Application from '../../../models/Application.js';
import FileUpload from '../../../models/FileUpload.js';
import { uploadToCloudinary } from '../../../lib/cloudinary.js';
import {
  validateFile,
  validateOrigin,
  formatFileSize,
  FILE_CONFIG,
} from '../../../lib/fileValidation.js';

/**
 * ==========================================
 * API ROUTE: POST /api/applications
 * ==========================================
 * 
 * Handles candidate application form submissions
 * 
 * PRODUCTION-READY FEATURES:
 * - MongoDB Atlas connection with caching
 * - Cloudinary file upload integration
 * - Comprehensive error handling
 * - Request validation
 * - Detailed logging for debugging
 * 
 * FLOW:
 * 1. Connect to MongoDB Atlas (cached connection)
 * 2. Parse and validate form data
 * 3. Upload files to Cloudinary
 * 4. Save application to database
 * 5. Return success/error response
 * 
 * VERCEL COMPATIBILITY:
 * - Works in serverless environment
 * - Handles cold starts gracefully
 * - Connection caching prevents pool exhaustion
 * - Automatic cleanup on function termination
 */

export async function POST(request) {
  console.log('\n========================================');
  console.log('📥 [API] POST /api/applications');
  console.log('⏰ [API] Request time:', new Date().toISOString());
  console.log('========================================\n');
  
  try {
    // ==========================================    // STEP 0: VALIDATE ORIGIN (SECURITY)
    // ==========================================
    console.log('🔒 [Step 0] Validating request origin...');
    
    const originValidation = validateOrigin(request);
    if (!originValidation.valid) {
      console.log('❌ Origin validation failed:', originValidation.error);
      return NextResponse.json(
        {
          success: false,
          errorType: 'ORIGIN_VALIDATION_FAILED',
          message: originValidation.error,
          hint: 'File uploads must be initiated from the website UI',
          timestamp: new Date().toISOString(),
        },
        { status: 403 }
      );
    }
    
    console.log('✅ Origin validation passed\n');
    
    // ==========================================    // STEP 1: CONNECT TO MONGODB ATLAS
    // ==========================================
    console.log('🔌 [Step 1] Connecting to MongoDB Atlas...');
    
    try {
      await connectDB();
      console.log('✅ [Step 1] MongoDB connection ready\n');
    } catch (dbError) {
      console.error('❌ MongoDB Connection Error:', {
        name: dbError.name,
        code: dbError.code,
        message: dbError.message,
      });

      const errorResponse = createErrorResponse(dbError, 'MongoClient.connect');
      return NextResponse.json(errorResponse, { status: getHttpStatus(dbError) });
    }
    
    // ==========================================
    // STEP 2: PARSE FORM DATA
    // ==========================================
    console.log('📝 [Step 2] Parsing multipart form data...');
    const formData = await request.formData();
    
    // Extract files
    const photograph = formData.get('photograph');
    const resume = formData.get('resume');
    
    // Step 3: Validate required files
    console.log('🔍 Step 3: Validating files...');
    if (!photograph || !resume) {
      console.log('❌ Validation failed: Missing files');
      return NextResponse.json(
        {
          success: false,
          errorType: 'MISSING_FILES',
          message: 'Photograph and resume are required',
          hint: 'Please upload both photograph and resume files',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
    
    // Comprehensive photograph validation
    const photographBuffer = await photograph.arrayBuffer();
    const photographValidation = await validateFile(photograph, 'image', photographBuffer);
    
    if (!photographValidation.valid) {
      console.log('❌ Photograph validation failed:', photographValidation.error);
      return NextResponse.json(
        {
          success: false,
          errorType: 'INVALID_FILE_TYPE',
          message: photographValidation.error,
          details: {
            fileName: photograph.name,
            fileSize: formatFileSize(photograph.size),
            fileType: photograph.type,
            category: 'photograph',
          },
          hint: `Allowed formats: ${FILE_CONFIG.image.allowedExtensions.join(', ')}. Max size: ${FILE_CONFIG.image.maxSize / 1024 / 1024}MB`,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
    
    // Comprehensive resume validation
    const resumeBuffer = await resume.arrayBuffer();
    const resumeValidation = await validateFile(resume, 'pdf', resumeBuffer);
    
    if (!resumeValidation.valid) {
      console.log('❌ Resume validation failed:', resumeValidation.error);
      return NextResponse.json(
        {
          success: false,
          errorType: 'INVALID_FILE_TYPE',
          message: resumeValidation.error,
          details: {
            fileName: resume.name,
            fileSize: formatFileSize(resume.size),
            fileType: resume.type,
            category: 'resume',
          },
          hint: `Allowed formats: ${FILE_CONFIG.pdf.allowedExtensions.join(', ')}. Max size: ${FILE_CONFIG.pdf.maxSize / 1024 / 1024}MB`,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
    
    console.log('✅ File validation passed');
    console.log(`  Photograph: ${photographValidation.sanitizedName} (${formatFileSize(photograph.size)})`);
    console.log(`  Resume: ${resumeValidation.sanitizedName} (${formatFileSize(resume.size)})`);
    
    // Step 4: Upload files to Cloudinary
    console.log('☁️ Step 4: Uploading files to Cloudinary...');
    
    // Log photograph details
    console.log('📸 Photograph details:');
    console.log(`  Name: ${photograph.name}`);
    console.log(`  Sanitized: ${photographValidation.sanitizedName}`);
    console.log(`  Size: ${formatFileSize(photograph.size)}`);
    console.log(`  Type: ${photograph.type}`);
    
    // Convert files to base64 for Cloudinary upload (buffers already loaded)
    const photographBase64 = `data:${photograph.type};base64,${Buffer.from(photographBuffer).toString('base64')}`;
    const resumeBase64 = `data:${resume.type};base64,${Buffer.from(resumeBuffer).toString('base64')}`;
    
    console.log(`  Base64 length: ${photographBase64.length}`);
    
    // Upload photograph to Cloudinary
    console.log('📤 Uploading photograph to Cloudinary...');
    const photographUpload = await uploadToCloudinary(
      photographBase64,
      'socialmm/applications/photographs',
      'image'
    );
    
    if (!photographUpload.success) {
      console.log('❌ Photograph upload failed:', photographUpload.error);
      return NextResponse.json(
        {
          success: false,
          errorType: 'CLOUDINARY_UPLOAD_FAILED',
          message: 'Failed to upload photograph',
          details: { error: photographUpload.error },
          hint: 'Please try again or contact support if the issue persists',
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
    console.log('✅ Photograph uploaded successfully!');
    console.log(`  Cloudinary URL: ${photographUpload.url}`);
    
    // Upload resume to Cloudinary
    console.log('📤 Uploading resume...');
    const resumeUpload = await uploadToCloudinary(
      resumeBase64,
      'socialmm/applications/resumes',
      'raw'
    );
    
    if (!resumeUpload.success) {
      console.log('❌ Resume upload failed:', resumeUpload.error);
      return NextResponse.json(
        {
          success: false,
          errorType: 'CLOUDINARY_UPLOAD_FAILED',
          message: 'Failed to upload resume',
          details: { error: resumeUpload.error },
          hint: 'Please try again or contact support if the issue persists',
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
    console.log('✅ Resume uploaded:', resumeUpload.url);
    
    // Save file upload records to database
    console.log('💾 Saving file upload records...');
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    
    try {
      // Save photograph record
      const photographRecord = new FileUpload({
        cloudinaryUrl: photographUpload.url,
        cloudinaryPublicId: photographUpload.publicId,
        cloudinaryResourceType: 'image',
        originalFileName: photograph.name,
        sanitizedFileName: photographValidation.sanitizedName,
        fileType: photograph.type,
        fileCategory: 'image',
        fileSize: photograph.size,
        uploadedBy: formData.get('emailAddress'),
        uploadPurpose: 'application_photograph',
        uploadSource: 'web',
        uploadIPAddress: ipAddress,
        userAgent,
        status: 'active',
        validationPassed: true,
      });
      await photographRecord.save();
      
      // Save resume record
      const resumeRecord = new FileUpload({
        cloudinaryUrl: resumeUpload.url,
        cloudinaryPublicId: resumeUpload.publicId,
        cloudinaryResourceType: 'raw',
        originalFileName: resume.name,
        sanitizedFileName: resumeValidation.sanitizedName,
        fileType: resume.type,
        fileCategory: 'pdf',
        fileSize: resume.size,
        uploadedBy: formData.get('emailAddress'),
        uploadPurpose: 'application_resume',
        uploadSource: 'web',
        uploadIPAddress: ipAddress,
        userAgent,
        status: 'active',
        validationPassed: true,
      });
      await resumeRecord.save();
      
      console.log('✅ File upload records saved');
    } catch (fileRecordError) {
      console.warn('⚠️ Failed to save file records (non-critical):', fileRecordError.message);
      // Continue with application submission even if file records fail
    }
    
    // Step 5: Prepare application data (ONLY URLs, no file buffers)
    console.log('📦 Step 5: Preparing application data...');
    const applicationData = {
      // Personal Information
      fullName: formData.get('fullName'),
      age: parseInt(formData.get('age')),
      gender: formData.get('gender') || '',
      
      // Contact Information
      mobileNumber: formData.get('mobileNumber'),
      emailAddress: formData.get('emailAddress'),
      city: formData.get('city'),
      state: formData.get('state'),
      
      // Educational Information
      highestQualification: formData.get('highestQualification'),
      specialization: formData.get('specialization'),
      collegeName: formData.get('collegeName'),
      yearOfPassing: parseInt(formData.get('yearOfPassing')),
      careerGap: parseFloat(formData.get('careerGap')) || 0,
      
      // Professional Information
      roleAppliedFor: formData.get('roleAppliedFor'),
      primarySkillSet: formData.get('primarySkillSet'),
      totalExperience: formData.get('totalExperience'),
      
      // Links
      linkedinUrl: formData.get('linkedinUrl') || '',
      githubUrl: formData.get('githubUrl') || '',
      
      // File URLs (stored as strings, NOT buffers)
      photographUrl: photographUpload.url,
      resumeUrl: resumeUpload.url,
      
      // Additional Fields
      availability: formData.get('availability'),
      declarationAccepted: formData.get('declarationAccepted') === 'true',
    };
    
    console.log('📋 Application data prepared for:', applicationData.emailAddress);
    
    // Step 6: Check for duplicate email
    console.log('🔍 Step 6: Checking for duplicate email...');
    const existingApplication = await Application.findOne({ 
      emailAddress: applicationData.emailAddress 
    });
    
    if (existingApplication) {
      console.log('❌ Duplicate email found:', applicationData.emailAddress);
      return NextResponse.json(
        { 
          success: false, 
          message: 'An application with this email address already exists' 
        },
        { status: 409 }
      );
    }
    console.log('✅ No duplicate found');
    
    // Step 7: Save to MongoDB
    console.log('💾 Step 7: Saving application to MongoDB...');
    console.log('🔍 [CRITICAL] About to call Application.save()');
    console.log('   This operation will:');
    console.log('   - INSERT document into MongoDB Atlas');
    console.log('   - CREATE database if not exists');
    console.log('   - CREATE collection if not exists');
    
    const application = new Application(applicationData);
    
    console.log('📝 [DEBUG] Application instance created');
    console.log('   Email:', application.emailAddress);
    console.log('   Name:', application.fullName);
    console.log('   Role:', application.roleAppliedFor);
    
    // ⭐⭐⭐ CRITICAL: This line actually inserts the document into MongoDB
    // The database will become visible in MongoDB Atlas ONLY after this line executes
    try {
      await application.save();
      
      console.log('✅ [CRITICAL] Application saved successfully!');
      console.log('💾 [VERIFY IN ATLAS] Check formsDB.applications collection');
      console.log('📊 Application ID:', application._id);
      console.log('👤 Applicant:', application.fullName);
      console.log('📧 Email:', application.emailAddress);
      console.log('🎯 Role:', application.roleAppliedFor);
      console.log('📸 Photo URL:', application.photographUrl);
      console.log('📄 Resume URL:', application.resumeUrl);
    } catch (saveError) {
      console.error('❌ MongoDB Save Error:', {
        name: saveError.name,
        code: saveError.code,
        message: saveError.message,
      });

      const errorResponse = createErrorResponse(saveError, 'insertApplication');
      return NextResponse.json(errorResponse, { status: getHttpStatus(saveError) });
    }
    
    // Step 8: Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Application submitted successfully',
        applicationId: application._id,
        data: {
          fullName: application.fullName,
          email: application.emailAddress,
          role: application.roleAppliedFor,
        }
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('❌ Application submission error:', error.message);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        {
          success: false,
          errorType: 'DATABASE_WRITE',
          message: 'Validation error: ' + errors.join(', '),
          location: 'formValidation',
          hint: 'Check that all required fields are filled correctly',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const errorResponse = createErrorResponse(error, 'submitApplication');
    return NextResponse.json(errorResponse, { status: getHttpStatus(error) });
  }
}

/**
 * Handle unsupported methods
 */
export async function GET() {
  return NextResponse.json(
    { success: false, message: 'Method not allowed. Use POST to submit applications.' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { success: false, message: 'Method not allowed. Use POST to submit applications.' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, message: 'Method not allowed. Use POST to submit applications.' },
    { status: 405 }
  );
}
