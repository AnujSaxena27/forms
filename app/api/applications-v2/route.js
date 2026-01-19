import { NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb.js';
import Application from '../../../models/Application.js';
import FileUpload from '../../../models/FileUpload.js';
import { uploadToCloudinary } from '../../../lib/cloudinary.js';
import {
  validateOrigin,
  validateContentType,
  validateFile,
  validateFormData,
} from '../../../lib/validation.js';
import {
  ErrorCodes,
  createErrorResponse,
  createSuccessResponse,
} from '../../../lib/errorHandler.js';
import { validateEnv } from '../../../lib/envValidator.js';

// Validate environment on module load
validateEnv();

export async function POST(request) {
  try {
    // 1. Validate Content-Type
    const contentTypeValidation = validateContentType(request);
    if (!contentTypeValidation.valid) {
      return createErrorResponse(
        ErrorCodes.INVALID_REQUEST,
        contentTypeValidation.error
      );
    }

    // 2. Validate Origin
    const originValidation = validateOrigin(request);
    if (!originValidation.valid) {
      return createErrorResponse(
        ErrorCodes.ORIGIN_BLOCKED,
        originValidation.error
      );
    }

    // 3. Connect to database
    await connectDB();

    // 4. Parse FormData
    const formData = await request.formData();

    // 5. Validate FormData doesn't contain external URLs
    const formDataValidation = validateFormData(formData);
    if (!formDataValidation.valid) {
      return createErrorResponse(
        ErrorCodes.INVALID_REQUEST,
        formDataValidation.error
      );
    }

    // 6. Extract and validate files
    const photograph = formData.get('photograph');
    const resume = formData.get('resume');

    if (!photograph || !resume) {
      return createErrorResponse(
        ErrorCodes.MISSING_FILES,
        'Both photograph and resume are required'
      );
    }

    // 7. Validate photograph
    const photoValidation = await validateFile(photograph, 'IMAGE');
    if (!photoValidation.valid) {
      return createErrorResponse(
        ErrorCodes.INVALID_FILE_TYPE,
        photoValidation.error,
        { field: 'photograph' }
      );
    }

    // 8. Validate resume
    const resumeValidation = await validateFile(resume, 'PDF');
    if (!resumeValidation.valid) {
      return createErrorResponse(
        ErrorCodes.INVALID_FILE_TYPE,
        resumeValidation.error,
        { field: 'resume' }
      );
    }

    // 9. Upload to Cloudinary (atomic operation)
    const folderPrefix = process.env.CLOUDINARY_FOLDER_PREFIX || 'uploads';
    
    const photographBase64 = `data:${photograph.type};base64,${Buffer.from(photoValidation.buffer).toString('base64')}`;
    const photographUpload = await uploadToCloudinary(
      photographBase64,
      `${folderPrefix}/applications/photographs`,
      'image'
    );

    if (!photographUpload.success) {
      return createErrorResponse(
        ErrorCodes.CLOUDINARY_UPLOAD_FAILED,
        'Failed to upload photograph',
        { cloudinaryError: photographUpload.error }
      );
    }

    const resumeBase64 = `data:${resume.type};base64,${Buffer.from(resumeValidation.buffer).toString('base64')}`;
    const resumeUpload = await uploadToCloudinary(
      resumeBase64,
      `${folderPrefix}/applications/resumes`,
      'raw'
    );

    if (!resumeUpload.success) {
      return createErrorResponse(
        ErrorCodes.CLOUDINARY_UPLOAD_FAILED,
        'Failed to upload resume',
        { cloudinaryError: resumeUpload.error }
      );
    }

    // 10. Check for duplicate email
    const emailAddress = formData.get('emailAddress');
    const existingApplication = await Application.findOne({ emailAddress });
    
    if (existingApplication) {
      return createErrorResponse(
        ErrorCodes.VALIDATION_FAILED,
        'Application with this email already exists'
      );
    }

    // 11. Prepare application data
    const applicationData = {
      fullName: formData.get('fullName'),
      age: parseInt(formData.get('age')),
      gender: formData.get('gender') || '',
      mobileNumber: formData.get('mobileNumber'),
      emailAddress,
      city: formData.get('city'),
      state: formData.get('state'),
      highestQualification: formData.get('highestQualification'),
      specialization: formData.get('specialization'),
      collegeName: formData.get('collegeName'),
      yearOfPassing: parseInt(formData.get('yearOfPassing')),
      careerGap: parseFloat(formData.get('careerGap')) || 0,
      roleAppliedFor: formData.get('roleAppliedFor'),
      primarySkillSet: formData.get('primarySkillSet'),
      totalExperience: formData.get('totalExperience'),
      linkedinUrl: formData.get('linkedinUrl') || '',
      githubUrl: formData.get('githubUrl') || '',
      photographUrl: photographUpload.url,
      resumeUrl: resumeUpload.url,
      availability: formData.get('availability'),
      declarationAccepted: formData.get('declarationAccepted') === 'true',
    };

    // 12. Save to database (atomic operation)
    const application = new Application(applicationData);
    await application.save();

    // 13. Save file records
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                      request.headers.get('x-real-ip') || 
                      'unknown';

    try {
      await FileUpload.create([
        {
          cloudinaryUrl: photographUpload.url,
          cloudinaryPublicId: photographUpload.publicId,
          originalFileName: photograph.name,
          sanitizedFileName: photoValidation.sanitizedName,
          fileType: photograph.type,
          fileCategory: 'image',
          fileSize: photograph.size,
          uploadedBy: emailAddress,
          uploadPurpose: 'application_photograph',
          relatedEntityId: application._id,
          relatedEntityType: 'Application',
          uploadSource: 'web',
          uploadIPAddress: ipAddress,
          userAgent,
        },
        {
          cloudinaryUrl: resumeUpload.url,
          cloudinaryPublicId: resumeUpload.publicId,
          originalFileName: resume.name,
          sanitizedFileName: resumeValidation.sanitizedName,
          fileType: resume.type,
          fileCategory: 'pdf',
          fileSize: resume.size,
          uploadedBy: emailAddress,
          uploadPurpose: 'application_resume',
          relatedEntityId: application._id,
          relatedEntityType: 'Application',
          uploadSource: 'web',
          uploadIPAddress: ipAddress,
          userAgent,
        },
      ]);
    } catch (error) {
      // File records are supplementary, don't fail the request
      console.error('Non-critical: Failed to save file records:', error.message);
    }

    // 14. Return success
    return createSuccessResponse(
      {
        applicationId: application._id,
        fullName: application.fullName,
        email: application.emailAddress,
        role: application.roleAppliedFor,
        submittedAt: application.submittedAt,
      },
      201
    );

  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return createErrorResponse(
        ErrorCodes.VALIDATION_FAILED,
        errors.join(', ')
      );
    }

    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'An unexpected error occurred',
      process.env.NODE_ENV === 'development' ? { error: error.message } : null
    );
  }
}

export async function GET() {
  return createErrorResponse(
    ErrorCodes.INVALID_REQUEST,
    'Method not allowed'
  );
}

export async function PUT() {
  return createErrorResponse(
    ErrorCodes.INVALID_REQUEST,
    'Method not allowed'
  );
}

export async function DELETE() {
  return createErrorResponse(
    ErrorCodes.INVALID_REQUEST,
    'Method not allowed'
  );
}
