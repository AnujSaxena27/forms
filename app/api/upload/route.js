import { NextResponse } from 'next/server';
import connectDB, { createErrorResponse, getHttpStatus } from '../../../lib/mongodb.js';
import FileUpload from '../../../models/FileUpload.js';
import { uploadToCloudinary } from '../../../lib/cloudinary.js';
import {
  validateFile,
  validateOrigin,
  FILE_CONFIG,
  formatFileSize,
} from '../../../lib/fileValidation.js';

/**
 * ==========================================
 * API ROUTE: POST /api/upload
 * ==========================================
 * 
 * PRODUCTION-READY FILE UPLOAD ENDPOINT
 * 
 * FEATURES:
 * ✅ Origin validation (prevents external direct uploads)
 * ✅ File type validation (whitelist approach)
 * ✅ File size validation (configurable limits)
 * ✅ MIME type verification with magic numbers
 * ✅ Cloudinary integration (secure cloud storage)
 * ✅ MongoDB storage (file metadata)
 * ✅ Comprehensive error handling
 * ✅ Security best practices
 * ✅ Detailed logging
 * 
 * SECURITY:
 * - Only accepts uploads from website UI
 * - Validates file content (not just extension)
 * - Sanitizes file names
 * - Prevents external URL injection
 * - Rate limiting ready
 * 
 * REQUEST FORMAT:
 * - Method: POST
 * - Content-Type: multipart/form-data
 * - Required fields:
 *   - file: File object
 *   - category: 'image' or 'pdf'
 *   - purpose: Upload purpose (optional)
 *   - uploadedBy: User identifier (optional)
 * 
 * RESPONSE FORMAT:
 * Success (201):
 * {
 *   success: true,
 *   message: "File uploaded successfully",
 *   data: {
 *     fileId: "...",
 *     fileName: "...",
 *     fileUrl: "...",
 *     fileSize: "...",
 *     fileType: "..."
 *   }
 * }
 * 
 * Error (4xx/5xx):
 * {
 *   success: false,
 *   error: "Error message",
 *   details: {...}
 * }
 */

export async function POST(request) {
  console.log('\n========================================');
  console.log('📥 [API] POST /api/upload');
  console.log('⏰ [API] Request time:', new Date().toISOString());
  console.log('========================================\n');

  try {
    // ==========================================
    // STEP 1: VALIDATE ORIGIN (SECURITY)
    // ==========================================
    console.log('🔒 [Step 1] Validating request origin...');
    
    const originValidation = validateOrigin(request);
    if (!originValidation.valid) {
      console.log('❌ Origin validation failed:', originValidation.error);
      return NextResponse.json(
        {
          success: false,
          error: originValidation.error,
          errorType: 'ORIGIN_VALIDATION_FAILED',
          hint: 'File uploads must be initiated from the website UI',
        },
        { status: 403 }
      );
    }
    
    console.log('✅ Origin validation passed\n');

    // ==========================================
    // STEP 2: CONNECT TO DATABASE
    // ==========================================
    console.log('🔌 [Step 2] Connecting to MongoDB...');
    
    try {
      await connectDB();
      console.log('✅ MongoDB connection ready\n');
    } catch (dbError) {
      console.error('❌ MongoDB Connection Error:', dbError.message);
      const errorResponse = createErrorResponse(dbError, 'connectDB');
      return NextResponse.json(errorResponse, { status: getHttpStatus(dbError) });
    }

    // ==========================================
    // STEP 3: PARSE FORM DATA
    // ==========================================
    console.log('📝 [Step 3] Parsing form data...');
    
    let formData;
    try {
      formData = await request.formData();
    } catch (parseError) {
      console.error('❌ Failed to parse form data:', parseError.message);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to parse form data',
          errorType: 'INVALID_REQUEST',
          hint: 'Ensure Content-Type is multipart/form-data',
        },
        { status: 400 }
      );
    }

    // Extract form fields
    const file = formData.get('file');
    const category = formData.get('category') || 'image';
    const purpose = formData.get('purpose') || 'general';
    const uploadedBy = formData.get('uploadedBy') || 'anonymous';
    const relatedEntityId = formData.get('relatedEntityId');
    const relatedEntityType = formData.get('relatedEntityType');

    console.log('📋 Form data:');
    console.log(`  Category: ${category}`);
    console.log(`  Purpose: ${purpose}`);
    console.log(`  Uploaded by: ${uploadedBy}`);
    console.log('');

    // ==========================================
    // STEP 4: VALIDATE FILE EXISTS
    // ==========================================
    console.log('🔍 [Step 4] Validating file...');
    
    if (!file) {
      console.log('❌ No file provided');
      return NextResponse.json(
        {
          success: false,
          error: 'No file provided',
          errorType: 'MISSING_FILE',
          hint: 'Please select a file to upload',
        },
        { status: 400 }
      );
    }

    // ==========================================
    // STEP 5: VALIDATE FILE TYPE AND SIZE
    // ==========================================
    console.log('🔍 [Step 5] Validating file type and size...');
    
    // Read file as array buffer for signature validation
    const arrayBuffer = await file.arrayBuffer();
    
    // Comprehensive validation
    const validation = await validateFile(
      file,
      category,
      arrayBuffer
    );

    if (!validation.valid) {
      console.log('❌ File validation failed:', validation.error);
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
          errorType: 'FILE_VALIDATION_FAILED',
          details: {
            fileName: file.name,
            fileSize: formatFileSize(file.size),
            fileType: file.type,
          },
        },
        { status: 400 }
      );
    }

    console.log('✅ File validation passed');
    console.log(`  File: ${validation.sanitizedName}`);
    console.log(`  Size: ${formatFileSize(file.size)}`);
    console.log(`  Type: ${file.type}\n`);

    // ==========================================
    // STEP 6: UPLOAD TO CLOUDINARY
    // ==========================================
    console.log('☁️ [Step 6] Uploading to Cloudinary...');
    
    // Convert to base64 for Cloudinary
    const base64 = `data:${file.type};base64,${Buffer.from(arrayBuffer).toString('base64')}`;
    
    // Determine Cloudinary resource type
    const resourceType = category === 'image' ? 'image' : 'raw';
    
    // Upload to Cloudinary
    const cloudinaryUpload = await uploadToCloudinary(
      base64,
      `${process.env.CLOUDINARY_FOLDER_PREFIX || 'uploads'}/${purpose}`,
      resourceType
    );

    if (!cloudinaryUpload.success) {
      console.error('❌ Cloudinary upload failed:', cloudinaryUpload.error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to upload file to cloud storage',
          errorType: 'CLOUDINARY_UPLOAD_FAILED',
          details: {
            cloudinaryError: cloudinaryUpload.error,
          },
        },
        { status: 500 }
      );
    }

    console.log('✅ Cloudinary upload successful');
    console.log(`  URL: ${cloudinaryUpload.url}`);
    console.log(`  Public ID: ${cloudinaryUpload.publicId}\n`);

    // ==========================================
    // STEP 7: SAVE TO DATABASE
    // ==========================================
    console.log('💾 [Step 7] Saving file metadata to database...');
    
    // Extract request metadata
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';

    // Create file upload record
    const fileUploadData = {
      // Cloudinary info
      cloudinaryUrl: cloudinaryUpload.url,
      cloudinaryPublicId: cloudinaryUpload.publicId,
      cloudinaryResourceType: resourceType,
      
      // File metadata
      originalFileName: file.name,
      sanitizedFileName: validation.sanitizedName,
      fileType: file.type,
      fileCategory: category,
      fileSize: file.size,
      fileSizeFormatted: formatFileSize(file.size),
      
      // Upload context
      uploadedBy,
      uploadPurpose: purpose,
      relatedEntityId: relatedEntityId || undefined,
      relatedEntityType: relatedEntityType || undefined,
      
      // Technical details
      uploadSource: 'web',
      uploadIPAddress: ipAddress,
      userAgent,
      
      // Status
      status: 'active',
      validationPassed: true,
    };

    try {
      const fileUpload = new FileUpload(fileUploadData);
      await fileUpload.save();
      
      console.log('✅ File metadata saved to database');
      console.log(`  File ID: ${fileUpload._id}\n`);

      // ==========================================
      // STEP 8: RETURN SUCCESS RESPONSE
      // ==========================================
      return NextResponse.json(
        {
          success: true,
          message: 'File uploaded successfully',
          data: {
            fileId: fileUpload._id,
            fileName: fileUpload.originalFileName,
            fileUrl: fileUpload.cloudinaryUrl,
            fileSize: fileUpload.fileSizeFormatted,
            fileType: fileUpload.fileType,
            uploadedAt: fileUpload.uploadedAt,
            cloudinaryPublicId: fileUpload.cloudinaryPublicId,
          },
        },
        { status: 201 }
      );
      
    } catch (saveError) {
      console.error('❌ Database save error:', saveError.message);
      
      // Note: File is already uploaded to Cloudinary at this point
      // In production, you might want to delete from Cloudinary if DB save fails
      
      if (saveError.name === 'ValidationError') {
        const errors = Object.values(saveError.errors).map(err => err.message);
        return NextResponse.json(
          {
            success: false,
            error: 'Validation error: ' + errors.join(', '),
            errorType: 'DATABASE_VALIDATION_ERROR',
            hint: 'File was uploaded but metadata validation failed',
          },
          { status: 400 }
        );
      }

      const errorResponse = createErrorResponse(saveError, 'saveFileMetadata');
      return NextResponse.json(errorResponse, { status: getHttpStatus(saveError) });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error(error.stack);

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred during file upload',
        errorType: 'INTERNAL_SERVER_ERROR',
        details: process.env.NODE_ENV === 'development' ? {
          message: error.message,
          stack: error.stack,
        } : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * ==========================================
 * GET /api/upload
 * ==========================================
 * Get file upload information or list uploads
 */
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');
    const uploadedBy = searchParams.get('uploadedBy');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get specific file by ID
    if (fileId) {
      const file = await FileUpload.findById(fileId);
      
      if (!file) {
        return NextResponse.json(
          { success: false, error: 'File not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: file.getFileSummary(),
      });
    }

    // Build query
    const query = { status: 'active' };
    if (uploadedBy) query.uploadedBy = uploadedBy;
    if (category) query.fileCategory = category;

    // Get list of files
    const files = await FileUpload.find(query)
      .sort({ uploadedAt: -1 })
      .limit(limit);

    return NextResponse.json({
      success: true,
      count: files.length,
      data: files.map(file => file.getFileSummary()),
    });

  } catch (error) {
    console.error('GET /api/upload error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * ==========================================
 * DELETE /api/upload
 * ==========================================
 * Soft delete a file
 */
export async function DELETE(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json(
        { success: false, error: 'File ID is required' },
        { status: 400 }
      );
    }

    const file = await FileUpload.findById(fileId);
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    await file.softDelete();

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });

  } catch (error) {
    console.error('DELETE /api/upload error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * ==========================================
 * HANDLE UNSUPPORTED METHODS
 * ==========================================
 */
export async function PUT() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
}
